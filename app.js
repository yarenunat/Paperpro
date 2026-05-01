const canvas=document.getElementById("canvas");
const ctx=canvas.getContext("2d");

canvas.width=innerWidth;
canvas.height=innerHeight;

let drawing=false;
let tool="pen";

let lastTime=0;

function setTool(t){tool=t;}

function newPage(){
 savePage(canvas.toDataURL());
 ctx.clearRect(0,0,canvas.width,canvas.height);
}

canvas.addEventListener("pointerdown",()=>drawing=true);
canvas.addEventListener("pointerup",()=>{
 drawing=false;
 ctx.beginPath();
});

canvas.addEventListener("pointermove",(e)=>{
 if(!drawing)return;

 const now=Date.now();
 const speed=now-lastTime;
 const pressure=e.pressure||0.5;

 let size=Math.max(1,10-(speed/5))*(pressure+0.5);

 ctx.lineWidth = tool==="pen"?size:25;
 ctx.strokeStyle = tool==="pen"?"black":"white";
 ctx.lineCap="round";

 ctx.lineTo(e.clientX,e.clientY);
 ctx.stroke();
 ctx.beginPath();
 ctx.moveTo(e.clientX,e.clientY);

 lastTime=now;
});

if("serviceWorker" in navigator){
 navigator.serviceWorker.register("service-worker.js");
}
