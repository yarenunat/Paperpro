let db;
const request = indexedDB.open("paperDB", 1);

request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("pages")) {
        db.createObjectStore("pages", { autoIncrement: true });
    }
};

request.onsuccess = (e) => {
    db = e.target.result;
    console.log("Veritabanı hazır.");
};

request.onerror = (e) => {
    console.error("IndexedDB Hatası:", e.target.error);
};

// Sayfayı kaydetme fonksiyonu (Global olarak erişilebilir)
window.savePage = function(imageDataURL) {
    if (!db) {
        console.warn("Veritabanı henüz hazır değil, kayıt atlandı.");
        return;
    }
    const tx = db.transaction("pages", "readwrite");
    const store = tx.objectStore("pages");
    
    const req = store.add({
        image: imageDataURL,
        date: new Date().toISOString()
    });

    req.onsuccess = () => {
        console.log("IndexedDB: Sayfa başarıyla kaydedildi.");
    };
    req.onerror = () => {
        console.error("IndexedDB: Kayıt başarısız.");
    };
};
