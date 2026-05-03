// --- BİLDİRİM SİSTEMİ (TOAST) ---
function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// --- EKRAN GEÇİŞLERİ ---
const journalScreen = document.getElementById('journal-screen');
const canvasScreen = document.getElementById('canvas-screen');
const openJournalBtn = document.getElementById('openJournalBtn');
const closeBtn = document.getElementById('closeBtn');

openJournalBtn.addEventListener('click', () => {
    journalScreen.classList.remove('active');
    canvasScreen.classList.add('active');
    resizeCanvas(); 
});

closeBtn.addEventListener('click', () => {
    canvasScreen.classList.remove('active');
    journalScreen.classList.add('active');
    // Çıkarken son durumu kaydet
    if(undoStack.length > 0) window.savePage(canvas.toDataURL());
});

// --- YENİ DEFTER OLUŞTURMA ---
const createNewJournalBtn = document.getElementById('createNewJournalBtn');
const journalsContainer = document.getElementById('journalsContainer');

createNewJournalBtn.addEventListener('click', () => {
    const newJournal = document.createElement('div');
    newJournal.className = 'journal';
    
    // Rastgele estetik bir arka plan
    const colors = [
        '#a18cd1 0%, #fbc2eb 100%', 
        '#84fab0 0%, #8fd3f4 100%', 
        '#fccb90 0%, #d57eeb 100%',
        '#e0c3fc 0%, #8ec5fc 100%'
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    newJournal.style.background = `linear-gradient(135deg, ${randomColor})`;
    
    newJournal.addEventListener('click', function() {
        document.querySelectorAll('.journal').forEach(j => j.classList.remove('active-journal'));
        this.classList.add('active-journal');
        
        setTimeout(() => {
            journalScreen.classList.remove('active');
            canvasScreen.classList.add('active');
            resizeCanvas();
            ctx.clearRect(0, 0, canvas.width, canvas.height); 
            undoStack = []; 
            saveState();
        }, 300);
    });

    // Animasyonlu ekleme
    newJournal.style.opacity = '0';
    newJournal.style.transform = 'scale(0.5)';
    journalsContainer.insertBefore(newJournal, createNewJournalBtn.parentNode);
    
    setTimeout(() => {
        newJournal.style.opacity = '0.5';
        newJournal.style.transform = 'scale(0.85)';
    }, 50);
    
    showToast("Yeni defter oluşturuldu 📓");
});

// --- ÇİZİM MOTORU ---
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
let drawing = false;
let currentTool = "pen";
let currentColor = "#2c3e50";
let lastX = 0, lastY = 0;
let undoStack = [];
let autoSaveTimeout; // Otomatik kayıt için zamanlayıcı

function resizeCanvas() {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width || window.innerWidth;
    tempCanvas.height = canvas.height || window.innerHeight;
    if(canvas.width) tempCtx.drawImage(canvas, 0, 0);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
}
window.addEventListener('resize', resizeCanvas);

function saveState() {
    if (undoStack.length > 15) undoStack.shift();
    undoStack.push(canvas.toDataURL());
}

// Araç ve Renk Seçimi
const tools = document.querySelectorAll('.tool');
const colors = document.querySelectorAll('.color-dot');

tools.forEach(tool => {
    tool.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        tools.forEach(t => t.classList.remove('active'));
        tool.classList.add('active');
        currentTool = tool.dataset.tool;
    });
});

colors.forEach(color => {
    color.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        colors.forEach(c => c.classList.remove('active'));
        color.classList.add('active');
        currentColor = color.dataset.color;
        
        if(currentTool === 'eraser') {
            document.querySelector('.tool[data-tool="pen"]').dispatchEvent(new Event('pointerdown'));
        }
    });
});

function setupBrush(speed = 0) {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";

    switch(currentTool) {
        case "pen":
            ctx.strokeStyle = currentColor;
            ctx.globalAlpha = 1.0;
            ctx.lineWidth = Math.max(1.5, 5 - (speed * 0.15));
            break;
        case "pencil":
            ctx.strokeStyle = currentColor;
            ctx.globalAlpha = 0.5;
            ctx.lineWidth = 2;
            break;
        case "marker":
            ctx.strokeStyle = currentColor;
            ctx.globalAlpha = 0.85;
            ctx.lineWidth = 14;
            break;
        case "watercolor":
            ctx.strokeStyle = currentColor;
            ctx.globalAlpha = 0.05;
            ctx.lineWidth = 40;
            ctx.shadowColor = currentColor;
            ctx.shadowBlur = 10;
            break;
        case "eraser":
            ctx.globalCompositeOperation = "destination-out";
            ctx.globalAlpha = 1.0;
            ctx.lineWidth = 40;
            break;
    }
}

// Çizim Algoritması
canvas.addEventListener("pointerdown", (e) => {
    drawing = true;
    lastX = e.clientX;
    lastY = e.clientY;
    
    setupBrush();
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(lastX + 0.1, lastY + 0.1); 
    ctx.stroke();
});

canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const speed = Math.sqrt(dx * dx + dy * dy);
    
    setupBrush(speed);
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.clientX, e.clientY);
    ctx.stroke();
    
    lastX = e.clientX;
    lastY = e.clientY;
});

canvas.addEventListener("pointerup", () => {
    if (drawing) {
        drawing = false;
        saveState();
        
        // Profesyonel Otomatik Kayıt (Debounce)
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            if (typeof window.savePage === "function") {
                window.savePage(canvas.toDataURL());
                showToast("Buluta kaydedildi ☁️");
            }
        }, 1500); // Kullanıcı 1.5 saniye duraklarsa kaydeder
    }
});

// --- STICKER / GÖRSEL EKLEME ---
const stickerInput = document.getElementById('stickerInput');
const addStickerBtn = document.getElementById('addStickerBtn');

addStickerBtn.addEventListener('click', () => stickerInput.click());

stickerInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if(!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            let drawWidth = img.width;
            let drawHeight = img.height;
            const maxWidth = window.innerWidth * 0.5; // Ekranın yarısı kadar olabilir
            
            if (drawWidth > maxWidth) {
                drawHeight = (maxWidth / drawWidth) * drawHeight;
                drawWidth = maxWidth;
            }

            const x = (canvas.width - drawWidth) / 2;
            const y = (canvas.height - drawHeight) / 2;
            
            ctx.globalCompositeOperation = "source-over";
            ctx.globalAlpha = 1.0;
            ctx.drawImage(img, x, y, drawWidth, drawHeight);
            
            saveState();
            showToast("Görsel eklendi 🖼️");
            if (typeof window.savePage === "function") window.savePage(canvas.toDataURL());
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
    e.target.value = ''; 
});

// --- BUTON İŞLEVLERİ ---
document.getElementById('undoBtn').addEventListener('click', () => {
    if (undoStack.length > 1) {
        undoStack.pop(); 
        const img = new Image();
        img.src = undoStack[undoStack.length - 1];
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
});

document.getElementById('clearBtn').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
    showToast("Sayfa temizlendi 🧹");
});

document.getElementById('saveBtn').addEventListener('click', () => {
    if (typeof window.savePage === "function") {
        window.savePage(canvas.toDataURL());
        showToast("Manuel olarak kaydedildi ✅");
    }
});

setTimeout(() => saveState(), 100);
