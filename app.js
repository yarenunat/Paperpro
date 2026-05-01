 // --- EKRAN GEÇİŞLERİ (Routing) ---
const journalScreen = document.getElementById('journal-screen');
const canvasScreen = document.getElementById('canvas-screen');
const openJournalBtn = document.getElementById('openJournalBtn');
const closeBtn = document.getElementById('closeBtn');

openJournalBtn.addEventListener('click', () => {
    journalScreen.classList.remove('active');
    canvasScreen.classList.add('active');
    resizeCanvas(); // Geçişte tuvali tam ekrana oturt
});

closeBtn.addEventListener('click', () => {
    canvasScreen.classList.remove('active');
    journalScreen.classList.add('active');
});

// --- ÇİZİM MOTORU ---
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

function resizeCanvas() {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width || window.innerWidth;
    tempCanvas.height = canvas.height || window.innerHeight;
    if(canvas.width) tempCtx.drawImage(canvas, 0, 0);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // DİKKAT: Artık arka planı beyaz YAPMIYORUZ (clearRect yapıyoruz)
    // Böylece CSS'teki paper-texture arkadan görünüyor.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
}
window.addEventListener('resize', resizeCanvas);

// Değişkenler
let drawing = false;
let currentTool = "pen";
let currentColor = "#2c3e50";
let lastX = 0, lastY = 0;
let undoStack = [];

const tools = document.querySelectorAll('.tool');
const colors = document.querySelectorAll('.color-dot');

function saveState() {
    if (undoStack.length > 15) undoStack.shift();
    undoStack.push(canvas.toDataURL());
}

// Araç ve Renk Seçimi (Tıklama Sorunu Çözüldü)
tools.forEach(tool => {
    tool.addEventListener('pointerdown', (e) => {
        e.stopPropagation(); // Tuvalin tıklamayı yutmasını engeller
        tools.forEach(t => t.classList.remove('active'));
        tool.classList.add('active');
        currentTool = tool.dataset.tool;
    });
});

colors.forEach(color => {
    color.addEventListener('pointerdown', (e) => {
        e.stopPropagation(); // Tuvalin tıklamayı yutmasını engeller
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

// Düzeltilmiş, Kesintisiz Çizim Algoritması
canvas.addEventListener("pointerdown", (e) => {
    drawing = true;
    lastX = e.clientX;
    lastY = e.clientY;
    
    setupBrush();
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    // Sadece tıklandığında (nokta) çizim yapabilmesi için:
    ctx.lineTo(lastX + 0.1, lastY + 0.1); 
    ctx.stroke();
});

canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    
    // Hız hesaplama
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
    }
});

// Temizle ve Geri Al
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
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Arka plan dokusunu silmeden temizler
    saveState();
});

// Başlangıç durumu
setTimeout(() => saveState(), 100);




 

