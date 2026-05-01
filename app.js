const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Responsive Canvas Ayarı
function resizeCanvas() {
    // Canvas içeriğini silinmekten korumak için geçici saklama
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width || innerWidth;
    tempCanvas.height = canvas.height || innerHeight;
    tempCtx.drawImage(canvas, 0, 0);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Arka planı beyaz yap (şeffaf png kaydetmemek için)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // İlk yüklemede çalıştır

// Durum Değişkenleri
let drawing = false;
let currentTool = "pen";
let currentColor = "#1a1a1a";
let points = []; // Akıcı çizim için nokta geçmişi
let undoStack = []; // Geri al geçmişi

// Ayarlar
const tools = document.querySelectorAll('.tool');
const colorPicker = document.getElementById('colorPicker');
const undoBtn = document.getElementById('undoBtn');
const clearBtn = document.getElementById('clearBtn');
const saveBtn = document.getElementById('saveBtn');

// Araç Seçimi
tools.forEach(btn => {
    btn.addEventListener('click', (e) => {
        tools.forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        currentTool = btn.dataset.tool;
    });
});

colorPicker.addEventListener('input', (e) => currentColor = e.target.value);

// Undo Sistemini Başlat
saveState();

function saveState() {
    if (undoStack.length > 20) undoStack.shift(); // Hafızayı korumak için maks 20 adım
    undoStack.push(canvas.toDataURL());
}

function undo() {
    if (undoStack.length > 1) {
        undoStack.pop(); // Mevcut durumu at
        const img = new Image();
        img.src = undoStack[undoStack.length - 1];
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    }
}

// Çizim Dinamiklerini Ayarla
function setupBrush() {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";

    switch(currentTool) {
        case "pen":
            ctx.lineWidth = 3;
            ctx.strokeStyle = currentColor;
            ctx.globalAlpha = 1.0;
            break;
        case "pencil":
            ctx.lineWidth = 1;
            ctx.strokeStyle = currentColor;
            ctx.globalAlpha = 0.4; // Kurşun kalem hafifliği
            break;
        case "watercolor":
            ctx.lineWidth = 20;
            ctx.strokeStyle = currentColor;
            ctx.globalAlpha = 0.05; // Üst üste binen sulu boya efekti
            ctx.shadowColor = currentColor;
            ctx.shadowBlur = 10;
            break;
        case "eraser":
            ctx.lineWidth = 30;
            ctx.globalCompositeOperation = "destination-out"; // Silme işlemi
            ctx.globalAlpha = 1.0;
            break;
    }
}

// Çizim İşlemleri
canvas.addEventListener("pointerdown", (e) => {
    drawing = true;
    points = [];
    points.push({ x: e.clientX, y: e.clientY });
    setupBrush();
});

canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;

    points.push({ x: e.clientX, y: e.clientY });

    // Akıcı Çizim: Noktalar arası Bezier eğrisi çiz
    if (points.length >= 3) {
        const lastTwoPoints = points.slice(-2);
        const controlPoint = lastTwoPoints[0];
        const endPoint = {
            x: (lastTwoPoints[0].x + lastTwoPoints[1].x) / 2,
            y: (lastTwoPoints[0].y + lastTwoPoints[1].y) / 2,
        };
        
        ctx.beginPath();
        ctx.moveTo(points[points.length - 3].x, points[points.length - 3].y);
        ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
        ctx.stroke();
        
        // Hız/Basınç bazlı dinamik kalınlık (Sadece kalem için)
        if (currentTool === "pen") {
            const speed = Math.sqrt(
                Math.pow(lastTwoPoints[1].x - lastTwoPoints[0].x, 2) + 
                Math.pow(lastTwoPoints[1].y - lastTwoPoints[0].y, 2)
            );
            const pressure = e.pressure !== 0 ? e.pressure : 0.5;
            // Hızlı çizildiğinde incelir, yavaşta kalınlaşır
            ctx.lineWidth = Math.max(1, 5 - (speed * 0.1)) * (pressure * 2);
        }
    }
});

canvas.addEventListener("pointerup", () => {
    if (!drawing) return;
    drawing = false;
    points = [];
    saveState(); // Çizim bittiğinde geri al geçmişine ekle
});

// Buton Olayları
undoBtn.addEventListener('click', undo);

clearBtn.addEventListener('click', () => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
});

saveBtn.addEventListener('click', () => {
    savePage(canvas.toDataURL());
    // Kısa bir animasyon geri bildirimi
    saveBtn.style.transform = "scale(1.2)";
    setTimeout(() => saveBtn.style.transform = "scale(1)", 200);
});

// Service Worker
if ("serviceWorker" in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register("service-worker.js")
        .catch(err => console.error("SW Registration failed: ", err));
    });
}

