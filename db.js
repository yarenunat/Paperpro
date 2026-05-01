let db;
const req = indexedDB.open("paperDB", 1);

req.onupgradeneeded = e => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("pages")) {
        db.createObjectStore("pages", { autoIncrement: true });
    }
};

req.onsuccess = e => {
    db = e.target.result;
};

req.onerror = e => {
    console.error("IndexedDB Hatası:", e.target.error);
};

function savePage(data) {
    if (!db) {
        console.warn("Veritabanı henüz hazır değil.");
        return;
    }
    const tx = db.transaction("pages", "readwrite");
    const store = tx.objectStore("pages");
    
    // Görüntüyü kaydet
    const request = store.add({
        image: data,
        date: new Date().toISOString()
    });

    request.onsuccess = () => {
        console.log("Sayfa başarıyla kaydedildi!");
    };
}

