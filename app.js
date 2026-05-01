const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

// Tuval Boyutlandırma
function resizeCanvas() {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width || window.innerWidth;
    tempCanvas.height = canvas.height || window.innerHeight;
    if(canvas.width) tempCtx.drawImage(canvas, 0, 0);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Arka planı Paper kırık beyazı yap
    ctx.fillStyle = "#f8f8f6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Değişkenler
let drawing = false;
let currentTool = "pen";
let currentColor = "#2c3e50";
let points = [];
let undoStack = [];

const tools = document.querySelectorAll('.tool');
const colors = document.querySelectorAll('.color-dot');

// Durum Kaydetme (Geri Al için)
function saveState() {
    if (undoStack.length > 15) undoStack.shift();
    undoStack.push(canvas.toDataURL());
}
saveState();

// Arayüz Etkileşimleri
tools.forEach(tool => {
    tool.addEventListener('click', () => {
        tools.forEach(t => t.classList.remove('active'));
        tool.classList.add('active');
        currentTool = tool.dataset.tool;
    });
});

colors.forEach(color => {
    color.addEventListener('click', () => {
        colors.forEach(c => c.classList.remove('active'));
        color.classList.add('active');
        currentColor = color.dataset.color;
        // Eğer silgi seçiliyse ve renge tıklandıysa, kaleme dön
        if(currentTool === 'eraser') {
            document.querySelector('.tool[data-tool="pen"]').click();
        }
    });
});

// Fırça Dinamikleri
function setupBrush(speed = 0) {
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";

    switch(currentTool) {
        case "pen": // Dolma Kalem (Hıza duyarlı ince/kalın)
            ctx.strokeStyle = currentColor;
            ctx.globalAlpha = 1.0;
            ctx.lineWidth = Math.max(1, 4 - (speed * 0.15));
            break;
        case "pencil": // Kurşun Kalem (Sabit, ince ve hafif şeffaf)
            ctx.strokeStyle = currentColor;
            ctx.globalAlpha = 0.5;
            ctx.lineWidth = 1.5;
            break;
        case "marker": // Keçeli Kalem (Kalın ve opak)
            ctx.strokeStyle = currentColor;
            ctx.globalAlpha = 0.9;
            ctx.lineWidth = 12;
            break;
        case "watercolor": // Sulu Boya (Çok kalın, çok şeffaf, kenarları yumuşak)
            ctx.strokeStyle = currentColor;
            ctx.globalAlpha = 0.04;
            ctx.lineWidth = 35;
            ctx.shadowColor = currentColor;
            ctx.shadowBlur = 10;
            break;
        case "eraser": // Silgi
            ctx.globalCompositeOperation = "destination-out";
            ctx.globalAlpha = 1.0;
            ctx.lineWidth = 40;
            break;
    }
}

// Çizim Motoru (Quadratic Bezier Curves)
canvas.addEventListener("pointerdown", (e) => {
    drawing = true;
    points = [{ x: e.clientX, y: e.clientY }];
    setupBrush();
});

canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    points.push({ x: e.clientX, y: e.clientY });

    if (points.length >= 3) {
        const lastTwo = points.slice(-2);
        const control = lastTwo[0];
        const end = {
            x: (lastTwo[0].x + lastTwo[1].x) / 2,
            y: (lastTwo[0].y + lastTwo[1].y) / 2,
        };
        
        // Hız hesaplama (Dolma kalem efekti için)
        const speed = Math.sqrt(Math.pow(lastTwo[1].x - lastTwo[0].x, 2) + Math.pow(lastTwo[1].y - lastTwo[0].y, 2));
        setupBrush(speed);

        ctx.beginPath();
        ctx.moveTo(points[points.length - 3].x, points[points.length - 3].y);
        ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
        ctx.stroke();
    }
});

canvas.addEventListener("pointerup", () => {
    if (drawing) {
        drawing = false;
        saveState();
    }
});

// Aksiyon Butonları
document.getElementById('undoBtn').addEventListener('click', () => {
    if (undoStack.length > 1) {
        undoStack.pop(); 
        const img = new Image();
        img.src = undoStack[undoStack.length - 1];
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    }
});

document.getElementById('clearBtn').addEventListener('click', () => {
    ctx.fillStyle = "#f8f8f6";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
});



 

