if (window === window.top) {
  function logDebug(msg) {
    console.log("ST_DEBUG (CS):", msg);
    chrome.storage.local.get("stt_logs", (data) => {
      const logs = data.stt_logs || [];
      logs.push(new Date().toLocaleTimeString() + " [CS]: " + msg);
      if (logs.length > 100) logs.shift();
      chrome.storage.local.set({ stt_logs: logs });
    });
  }

  logDebug("Nesine scripti tetiklendi. URL: " + window.location.href);

  const isPlayTab = window.location.search.includes("stt_play=true");

chrome.storage.local.get(["stformul_pending_coupon", "stformul_total_saved", "stformul_run_suffix"], async (data) => {
  const couponData = data.stformul_pending_coupon;
  let totalSaved = data.stformul_total_saved || 0;
  const runSuffix = data.stformul_run_suffix || "STT";
  const isPlaying = couponData && couponData.length > 0;
  
  logDebug("Kupon oynatma durumu: " + isPlaying + ", isPlayTab: " + isPlayTab + ", runSuffix: " + runSuffix);
  
  if (isPlaying && !isPlayTab) {
    logDebug("Kupon oynatma modundayız ama bu sekme stt_play parametresine sahip değil, askıya alındı.");
    return;
  }
  
  if (!isPlaying) {
    if (totalSaved > 0) {
      if (!isPlayTab) return;
      
      logDebug("Tüm kuponlar tamamlandı, temizlik yapılıyor...");
      chrome.storage.local.remove(["stformul_total_saved", "stformul_run_suffix"]);
      alert(`ST Formül: Oynanması istenen tüm kolonlar (Toplam: ${totalSaved}) Nesine'ye KAYDEDİLDİ!\nLütfen Nesine hesabınızdaki 'Kayıtlı Kuponlarım' bölümünden kontrol ediniz.`);
      window.location.href = "https://www.nesine.com/sportoto";
      return;
    }
    
    // Sadece oran tarama modundayız
    console.log("ST Formül: Oran tarama botu devrede...");
    
    function findRowContainer(i) {
      const el0 = document.getElementById(`m-c-${i}-0-0`);
      if (!el0) return null;
      let curr = el0.parentElement;
      while (curr) {
        if (curr.tagName === 'TR') {
          return curr;
        }
        curr = curr.parentElement;
      }
      // Fallback: climb up 5 levels
      let fallback = el0;
      for (let j = 0; j < 5; j++) {
        if (fallback.parentElement) fallback = fallback.parentElement;
      }
      return fallback;
    }

    let attempts = 0;
    const scanInterval = setInterval(() => {
      attempts++;
      const p1Input = document.getElementById("m-c-0-0-0");
      if (p1Input) {
        clearInterval(scanInterval);
        logDebug("Oran tarama: Tablo DOM üzerinde bulundu.");
        const rates = [];
        for (let i = 0; i < 15; i++) {
          const container = findRowContainer(i);
          let p1 = 33, px = 33, p2 = 34;
          if (container) {
            const text = container.innerText || container.textContent || "";
            let matches = [];
            let match;
            const regex1 = /%\s*(\d+)/g;
            while ((match = regex1.exec(text)) !== null) {
              matches.push(parseInt(match[1], 10));
            }
            if (matches.length < 3) {
              matches = [];
              const regex2 = /(\d+)\s*%/g;
              while ((match = regex2.exec(text)) !== null) {
                matches.push(parseInt(match[1], 10));
              }
            }
            if (matches.length >= 3) {
              p1 = matches[0];
              px = matches[1];
              p2 = matches[2];
            }
          }
          rates.push([p1, px, p2]);
        }
        logDebug("Oranlar başarıyla okundu, background'a yollanıyor: " + JSON.stringify(rates));
        chrome.runtime.sendMessage({ action: "SEND_SCRAPED_RATES", rates: rates });
      } else if (attempts > 30) {
        clearInterval(scanInterval);
        console.warn("ST Formül: Oran tarama zaman aşımına uğradı.");
      }
    }, 500);
    return; // Oynama mantığına geçme
  }

  console.log(`Kalan kolon sayısı: ${couponData.length}. İşleme başlanıyor...`);
  
  // Nesine sayfasının tam yüklenmesi için biraz bekle
  await sleep(3000);
  
  try {
    const columnsToPlay = couponData.slice(0, 4);
    const remainingColumns = couponData.slice(4);
    
    // Geri kalanları anında kaydediyoruz ki, sayfa yenilendiğinde bot nereden devam edeceğini bilsin
    chrome.storage.local.set({ stformul_pending_coupon: remainingColumns }, async () => {
       await processCouponBatch(columnsToPlay, totalSaved, runSuffix);
    });
  } catch (err) {
    console.error("Kupon aktarım hatası:", err);
    alert("ST Formül: Kupon aktarılırken bir hata oluştu.");
  }
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processCouponBatch(columnsToPlay, totalSaved, runSuffix) {
  console.log(`ST Formül: Bu turda ${columnsToPlay.length} kolon dolduruluyor...`);

  // 0. Hata/Bilgi Modalı (ilk açılışta varsa)
  const modalBtns = Array.from(document.querySelectorAll('button, a')).filter(btn => {
    if (!btn.innerText) return false;
    const t = btn.innerText.trim().toLowerCase();
    return t === 'tamam' || t === 'kapat' || t === 'vazgeç';
  });
  modalBtns.forEach(btn => btn.click());
  await sleep(500);

  // Butonları bul
  const visibleBtns = Array.from(document.querySelectorAll('a, button')).filter(el => el.offsetParent !== null);
  const playIndex = visibleBtns.findIndex(el => el.innerText && el.innerText.trim().toLowerCase() === 'hemen oyna');

  let diskBtn = null;
  let trashBtn = null;

  if (playIndex >= 2) {
    diskBtn = visibleBtns[playIndex - 1]; 
    trashBtn = visibleBtns[playIndex - 2]; 
  }

  // 1. Ekranı temizle
  if (trashBtn) {
    trashBtn.click();
    await sleep(500);
  } else {
    const checkedBoxes = document.querySelectorAll('input[type="checkbox"][id^="m-c-"]:checked');
    checkedBoxes.forEach(box => box.click());
    await sleep(500);
  }
  
  // 2. Kolonları doldur
  for (let i = 0; i < columnsToPlay.length; i++) {
    const column = columnsToPlay[i]; 
    const groupIndex = i; 
    
    for (let matchIndex = 0; matchIndex < 15; matchIndex++) {
      if (matchIndex >= column.length) break;
      const prediction = String(column[matchIndex]).toUpperCase(); 
      let choiceIndex = -1;
      if (prediction === '1') choiceIndex = 0;
      else if (prediction === '0' || prediction === 'X') choiceIndex = 1;
      else if (prediction === '2') choiceIndex = 2;
      
      if (choiceIndex !== -1) {
        const inputId = `m-c-${matchIndex}-${groupIndex}-${choiceIndex}`;
        const checkbox = document.getElementById(inputId);
        if (checkbox) checkbox.click();
      }
      await sleep(20); 
    }
  }
  
  await sleep(500); 
  
  // 3. KAYDET
  if (diskBtn) {
    console.log(`Disket butonuna basıldı, kupon adı modalı bekleniyor...`);
    
    let attempts = 0;
    const saveInterval = setInterval(async () => {
      attempts++;
      
      const modalInputs = Array.from(document.querySelectorAll('input[type="text"]')).filter(el => el.offsetParent !== null);
      
      if (modalInputs.length > 0) {
        clearInterval(saveInterval);
        
        const nameInput = modalInputs[modalInputs.length - 1]; 
        
        // Kupon Adı: ST_runSuffix_Index, örn: ST_0807_1530_1
        const kuponIndex = Math.floor(totalSaved / 4) + 1;
        const couponName = `ST_${runSuffix}_${kuponIndex}`; 
        
        nameInput.value = couponName;
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        nameInput.dispatchEvent(new Event('change', { bubbles: true }));
        await sleep(500);

        const allVisibleBtns = Array.from(document.querySelectorAll('button, a, span, div')).filter(el => el.offsetParent !== null && el.innerText);
        const yellowKaydetBtn = allVisibleBtns.find(btn => {
          return btn.innerText.trim().toLowerCase() === 'kaydet' && btn.children.length === 0;
        });

        if (yellowKaydetBtn) {
          logDebug("Kupon kaydediliyor. İsim: " + couponName);
          yellowKaydetBtn.click(); // Sadece tek tık, mükerrer kaydı önlemek için dispatchEvent kaldırıldı!
          console.log(`Kupon ${couponName} olarak kaydedildi.`);
          
          // Nesine'nin büyük yeşil başarı ekranının gelmesi için güvenli süre bekle
          await sleep(2500); 
          
          // Kayıt başarılı oldu, rakamı güncelle
          totalSaved += columnsToPlay.length;
          chrome.storage.local.set({ stformul_total_saved: totalSaved }, () => {
             console.log("Sıradaki kolonlar için sayfa yenileniyor...");
             window.location.reload(); // Sihirli dokunuş: Sayfayı yenile ve başarı ekranından kurtul!
          });
        } else {
          console.warn("Sarı Kaydet butonu bulunamadı!");
          alert("ST Formül: Kupon adı girilemedi, işlem durduruldu.");
        }
      } else {
        // Modal açılana kadar her 500ms'de bir basmayı dene (React state güncellemeleri/gecikmeleri için)
        console.log(`Disket butonuna basma denemesi: ${attempts}`);
        diskBtn.click();
      }
      
      if (attempts > 15) { // 7.5 saniye limit
        clearInterval(saveInterval);
        console.warn("Disket butonuna basıldı ama modal inputu açılmadı.");
        alert("ST Formül: Kupon adı inputu bulunamadı, işlem durduruldu.");
      }
    }, 500);
  } else {
    console.warn("Disket (Kaydet) butonu bulunamadı!");
    alert("ST Formül: Disket (Kaydet) butonu bulunamadı, işlem durduruldu.");
  }
}
}
