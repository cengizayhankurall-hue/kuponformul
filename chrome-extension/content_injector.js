// content_injector.js

function logDebug(msg) {
  console.log("ST_DEBUG (INJ):", msg);
  chrome.storage.local.get("stt_logs", (data) => {
    const logs = data.stt_logs || [];
    logs.push(new Date().toLocaleTimeString() + " [INJ]: " + msg);
    if (logs.length > 100) logs.shift();
    chrome.storage.local.set({ stt_logs: logs });
  });
}

logDebug("content_injector devrede.");

// Web sayfasından (bizim sitemizden) gelen özel mesajları dinle
window.addEventListener("message", function(event) {
  // Sadece aynı pencereden (sitemizden) gelen mesajları kabul et
  if (event.source !== window || !event.data) {
    return;
  }

  // 1. Kupon Oynatma Mesajı
  if (event.data.type === "ST_PLAY_COUPON") {
    const couponData = event.data.payload;
    logDebug("Web sayfasından kupon oynatma verisi alındı. Kolon sayısı: " + (couponData ? couponData.length : 0));

    chrome.runtime.sendMessage({ action: "PLAY_ON_NESINE", data: couponData }, (response) => {
      if (response && response.success) {
        logDebug("PLAY_ON_NESINE yanıtı başarılı.");
        window.postMessage({ type: "ST_COUPON_SENT_SUCCESS" }, "*");
      } else {
        logDebug("PLAY_ON_NESINE yanıtı başarısız veya tanımsız.");
      }
    });
  }

  // 2. Oran Çekme Mesajı
  if (event.data.type === "ST_GET_NESINE_RATES") {
    logDebug("Web sayfasından oran çekme talebi alındı.");
    chrome.runtime.sendMessage({ action: "GET_RATES" }, (response) => {
      if (response && response.success) {
        logDebug("GET_RATES yanıtı başarılı. Oranlar web sayfasına iletiliyor.");
        window.postMessage({ type: "ST_NESINE_RATES_SUCCESS", payload: response.rates }, "*");
      } else {
        logDebug("GET_RATES yanıtı başarısız: " + (response ? response.error : "Bilinmeyen hata"));
        window.postMessage({ type: "ST_NESINE_RATES_ERROR" }, "*");
      }
    });
  }

  // 3. İddaa Bülteni Çekme Mesajı
  if (event.data.type === "ST_GET_IDDAA_BULLETIN") {
    logDebug("Web sayfasından İddaa bülten çekme talebi alındı.");
    chrome.runtime.sendMessage({ action: "GET_IDDAA_BULLETIN" }, (response) => {
      if (response && response.success) {
        logDebug("GET_IDDAA_BULLETIN yanıtı başarılı. Bülten web sayfasına iletiliyor.");
        window.postMessage({ type: "ST_IDDAA_BULLETIN_SUCCESS", payload: response.data }, "*");
      } else {
        logDebug("GET_IDDAA_BULLETIN yanıtı başarısız: " + (response ? response.error : "Bilinmeyen hata"));
        window.postMessage({ type: "ST_IDDAA_BULLETIN_ERROR", error: response ? response.error : "Bilinmeyen hata" }, "*");
      }
    });
  }
});

// Günlükleri her 3 saniyede bir sitemizin konsoluna yazdırarak hata ayıklamayı kolaylaştıralım
setInterval(() => {
  chrome.storage.local.get("stt_logs", (data) => {
    if (data.stt_logs) {
      console.log("🔍 [Eklenti Günlükleri]:\n" + data.stt_logs.join("\n"));
    }
  });
}, 3000);
