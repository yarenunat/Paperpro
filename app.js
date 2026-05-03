// app.js

// --- NETLİK İÇİN RETINA DPI AYARI ---
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const dpr = window.devicePixelRatio || 1; // Ekranın pixel oranı ( Retinalarda 2x veya 3x)

function resizeCanvas() {
    // Fiziksel boyutu (CSS) ekran kadar yap
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    // Gerçek canvas boyutunu dpr ile çarpıp netleştir
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    // Tüm çizim komutlarını dpr ile ölçeklendir
    ctx.scale(dpr, dpr);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // İlk açılışta ölçekle

// --- BİLDİRİM VE GEÇİŞLER (Aynı Mantık) ---
function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast'; toast.textContent = message; container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 2000);
}

document.getElementById('openJournalBtn').addEventListener('click', () => {
    document.getElementById('journal-screen').classList.remove('active');
    document.getElementById('canvas-screen').classList.add('active');
    // Canvas ölçeklerini ve içeriğini tekrar kur
    resizeCanvas();
    if(undoStack.length > 0) {
        const img = new Image(); img.src = undoStack[undoStack.length - 1];
        img.onload = () => ctx.drawImage(img, 0, 0, canvas.width/dpr, canvas.height/dpr);
    }
});

document.getElementById('closeBtn').addEventListener('click', () => {
    document.getElementById('canvas-screen').classList.remove('active');
    document.getElementById('journal-screen').classList.add('active');
    if(undoStack.length > 0 && typeof window.savePage === "function") window.savePage(canvas.toDataURL());
});

// --- DOKULU FIRÇA MOTORU (STAMPING) ---
let drawing = false;
let currentTool = "fountain"; // Procreate fırçaları
let currentColor = "#2c3e50";
let lastX = 0, lastY = 0;
let undoStack = [];
let autoSaveTimeout;

// Fırça Dokularını Yükle (Stamp Images)
// Proje klasörüne bu dosya adlarını eklemeniz gerekir (charcoal_stamp.png vb.)
const brushTextures = {
    fountain: createProgrammaticStamp('circle', 10), // Programlı stamp
    ballpoint: createProgrammaticStamp('circle', 5, 0.9), // Daha ince tükenmez
    charcoal: loadStampTexture('charcoal_stamp.png'), // DOKULU FIRÇA DOSYASI (Premium doku için şart)
    eraser: createProgrammaticStamp('circle', 40)
};

// Eğer resim dosyası yoksa, Vanilla JS ile basit bir dokulu stamp oluşturur
function createProgrammaticStamp(type, size, opacity = 1.0) {
    const stamp = document.createElement('canvas');
    stamp.width = size; stamp.height = size;
    const sCtx = stamp.getContext('2d');
    
    sCtx.globalAlpha = opacity;
    sCtx.fillStyle = '#000'; // Renk sonra değişecek
    if(type === 'circle') {
        sCtx.beginPath();
        sCtx.arc(size/2, size/2, size/2, 0, Math.PI*2);
        sCtx.fill();
    }
    return stamp;
}

// Gerçek bir doku dosyası yükler (En premium hissiyat)
function loadStampTexture(url) {
    const img = new Image();
    img.src = url;
    // Eğer dosya yoksa, programlı karakalem oluştur (Yedek)
    img.onerror = () => { 
        brushTextures.charcoal = createProgrammaticStamp('circle', 30, 0.2); 
    };
    return img;
}

// Renk Seçimi ve Fırça Rengini Güncelleme
function getStamp(tool) {
    const stampCanvas = brushTextures[tool];
    if(!stampCanvas) return null;

    // Eğer programlı stamp ise, renginicurrentColor ile boya
    if(stampCanvas instanceof HTMLCanvasElement && tool !== 'eraser') {
        const coloredStamp = document.createElement('canvas');
        coloredStamp.width = stampCanvas.width; coloredStamp.height = stampCanvas.height;
        const cCtx = coloredStamp.getContext('2d');
        
        cCtx.fillStyle = currentColor;
        cCtx.fillRect(0, 0, stampCanvas.width, stampCanvas.height);
        cCtx.globalCompositeOperation = "destination-in";
        cCtx.drawImage(stampCanvas, 0, 0);
        return coloredStamp;
    }
    // Eraser veya dosya dokusu ise olduğu gibi döndür (eraser Composite ile çözülecek)
    return stampCanvas;
}

// El Hızına Duyarlı Çizim Algoritması (PRO motor)
canvas.addEventListener("pointerdown", (e) => {
    drawing = true;
    lastX = e.clientX; lastY = e.clientY;
    
    // Nokta atışı (Damga)
    const currentStamp = getStamp(currentTool);
    if(!currentStamp) return;

    if(currentTool === 'eraser') ctx.globalCompositeOperation = "destination-out";
    else ctx.globalCompositeOperation = "source-over";

    ctx.drawImage(currentStamp, lastX - currentStamp.width/2, lastY - currentStamp.height/2);
});

canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const currentStamp = getStamp(currentTool);
    if(!currentStamp) return;

    if(currentTool === 'eraser') ctx.globalCompositeOperation = "destination-out";
    else ctx.globalCompositeOperation = "source-over";

    // Hız Hesaplama (Boşluğu kapatmak için)
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const speed = distance; // Hız, mesafedir

    // Fırça Dinamikleri (Fırçanın hızla değişimi)
    let stampWidth = currentStamp.width;
    let stampHeight = currentStamp.height;
    let stampAlpha = 1.0;

    switch(currentTool) {
        case 'fountain': // Hızlı çizilirse incelir
            stampWidth = stampHeight = Math.max(2, currentStamp.width - (speed * 0.1));
            break;
        case 'ballpoint': // Hep aynı kalır
            break;
        case 'charcoal': // Hızlı çizilirse dokusu artar, opaklık düşer
            stampAlpha = Math.max(0.1, 0.4 - (speed * 0.01));
            break;
    }

    // İki nokta arasındaki boşluğu (The Gap) damgalama ile doldurma
    // Bu, "boşluk" sorununu çözer
    for (let i = 0; i < distance; i += stampWidth * 0.25) { // Her çeyrek fırça boyunda bir stamp bas
        const x = lastX + (Math.cos(angle) * i);
        const y = lastY + (Math.sin(angle) * i);
        
        ctx.globalAlpha = stampAlpha;
        ctx.drawImage(currentStamp, x - stampWidth/2, y - stampHeight/2, stampWidth, stampHeight);
    }
    ctx.globalAlpha = 1.0;

    lastX = e.clientX;
    lastY = e.clientY;
});

canvas.addEventListener("pointerup", () => {
    if (drawing) {
        drawing = false;
        undoStack.push(canvas.toDataURL());
        
        // Otomatik Kayıt (Debounce)
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            if (typeof window.savePage === "function") window.savePage(canvas.toDataURL());
            showToast("Buluta kaydedildi ☁️");
        }, 1500); 
    }
});

// UI ve Araç Seçimi (Procreate Fırçaları)
const tools = document.querySelectorAll('.tool');
tools.forEach(tool => {
    tool.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        tools.forEach(t => t.classList.remove('active'));
        tool.classList.add('active');
        currentTool = tool.dataset.tool;
    });
});

// Renkler (Aynı Mantık)
const colorDots = document.querySelectorAll('.color-dot');
colorDots.forEach(dot => {
    dot.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        colorDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        currentColor = dot.dataset.color;
    });
});

// Geri Al ve Temizle (DPI Desteği ile)
document.getElementById('undoBtn').addEventListener('click', () => {
    if (undoStack.length > 1) {
        undoStack.pop(); 
        const img = new Image(); img.src = undoStack[undoStack.length - 1];
        img.onload = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width/dpr, canvas.height/dpr); };
    } else { ctx.clearRect(0, 0, canvas.width, canvas.height); }
});

// Resim Ekleme (DPI Desteği ile)
const stickerInput = document.getElementById('stickerInput');
document.getElementById('addStickerBtn').addEventListener('click', () => stickerInput.click());
stickerInput.addEventListener('change', (e) => {
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const maxWidth = (window.innerWidth * 0.5); // CSS boyutu
            let dW = img.width, dH = img.height;
            if(dW > maxWidth) { dH = (maxWidth/dW)*dH; dW = maxWidth; }
            const x = (window.innerWidth - dW) / 2; const y = (window.innerHeight - dH) / 2;
            
            ctx.globalCompositeOperation = "source-over";
            ctx.drawImage(img, x, y, dW, dH);
            undoStack.push(canvas.toDataURL());
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
});
