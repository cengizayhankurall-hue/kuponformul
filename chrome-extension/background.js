// background.js

function logDebug(msg) {
  console.log("ST_DEBUG (BG):", msg);
  chrome.storage.local.get("stt_logs", (data) => {
    const logs = data.stt_logs || [];
    logs.push(new Date().toLocaleTimeString() + " [BG]: " + msg);
    // Keep only last 100 logs
    if (logs.length > 100) logs.shift();
    chrome.storage.local.set({ stt_logs: logs });
  });
}

// Start fresh logs on bg load
chrome.storage.local.set({ stt_logs: ["Eklenti arka planı yüklendi. Zaman: " + new Date().toLocaleTimeString()] });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "PLAY_ON_NESINE") {
    logDebug("PLAY_ON_NESINE aksiyonu tetiklendi. Kolon sayısı: " + (request.data ? request.data.length : 0));
    
    // Benzersiz kupon adı öneki oluştur (GünAy_SaatDakika formatında, örn: 0807_1530)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const runSuffix = `${day}${month}_${hours}${minutes}`;
    
    // Gelen veriyi ve öneki storage'a kaydet
    chrome.storage.local.set({ 
      stformul_pending_coupon: request.data,
      stformul_run_suffix: runSuffix
    }, () => {
      logDebug("Kupon verisi ve run_suffix hafızaya yazıldı: " + runSuffix);
      
      // Sekmeyi aç
      chrome.tabs.create({ url: "https://www.nesine.com/sportoto?stt_play=true" }, (tab) => {
        logDebug("Yeni Nesine sekmesi açıldı. Sekme ID: " + tab.id);
        sendResponse({ success: true });
      });
    });
    return true; 
  }

  if (request.action === "GET_RATES") {
    logDebug("GET_RATES aksiyonu tetiklendi. Aktif sekme açılıyor (yüklenmesi garanti olsun diye)...");
    chrome.tabs.create({ url: "https://www.nesine.com/sportoto", active: false }, (tab) => {
      logDebug("Aktif Nesine sekmesi açıldı. Sekme ID: " + tab.id);
      let hasReplied = false;
      
      const ratesListener = (msg, sender2) => {
        if (sender2.tab && sender2.tab.id === tab.id && msg.action === "SEND_SCRAPED_RATES") {
          logDebug("Pasif sekmeden oran verileri başarıyla alındı.");
          hasReplied = true;
          chrome.tabs.remove(tab.id);
          chrome.runtime.onMessage.removeListener(ratesListener);
          sendResponse({ success: true, rates: msg.rates });
        }
      };
      
      chrome.runtime.onMessage.addListener(ratesListener);
      
      // Güvenlik: 12 saniye içinde yanıt gelmezse sekmeyi kapat ve hata dön
      setTimeout(() => {
        if (!hasReplied) {
          logDebug("Pasif sekme oran tarama zaman aşımına uğradı (12sn).");
          chrome.tabs.remove(tab.id);
          chrome.runtime.onMessage.removeListener(ratesListener);
          sendResponse({ success: false, error: "Nesine'den oranlar çekilemedi, zaman aşımı." });
        }
      }, 12000);
    });
    return true; // Asenkron yanıt için
  }

  if (request.action === "GET_IDDAA_BULLETIN") {
    logDebug("GET_IDDAA_BULLETIN aksiyonu tetiklendi. Maçkolik ve Nesine üzerinden bülten taranıyor...");
    
    const fetchMackolikDay = (offset) => {
      const dObj = new Date();
      const trNow = new Date(dObj.toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
      trNow.setDate(trNow.getDate() + offset);
      const dd = String(trNow.getDate()).padStart(2, '0');
      const mm = String(trNow.getMonth() + 1).padStart(2, '0');
      const yyyy = trNow.getFullYear();
      const dStr = `${dd}/${mm}/${yyyy}`;
      const url = `https://arsiv.mackolik.com/AjaxHandlers/ProgramDataHandler.ashx?type=6&sortValue=DATE&day=${dStr}&sort=-1&sortDir=-1&groupId=-1&np=0&sport=1`;

      return fetch(url, {
        headers: {
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      .then(res => res.text())
      .catch(() => '');
    };

    Promise.all([0, 1, 2, 3, 4, 5, 6].map(fetchMackolikDay))
      .then(texts => {
        const validTexts = texts.filter(t => t && t.length > 500);
        if (validTexts.length > 0) {
          logDebug(`Maçkolik'ten ${validTexts.length} günlük bülten eklentiyle başarıyla çekildi.`);
          sendResponse({ success: true, source: 'mackolik', days: validTexts });
          return;
        }
        throw new Error("Maçkolik yanıtları yetersiz");
      })
      .catch(() => {
        logDebug("Maçkolik başarısız oldu, Nesine bültenine geçiliyor...");
        fetch("https://bulten.nesine.com/api/bulten/getprebultenfull")
          .then(res => {
            if (!res.ok) throw new Error("Bülten API HTTP hatası: " + res.status);
            return res.json();
          })
          .then(data => {
            logDebug("Nesine bülten verisi başarıyla çekildi.");
            sendResponse({ success: true, source: 'nesine', data: data });
          })
          .catch(err => {
            logDebug("Nesine bülten verisi de çekilemedi: " + err.message);
            sendResponse({ success: false, error: err.message });
          });
      });
    return true; // Asenkron yanıt için
  }
});
