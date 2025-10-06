const video = document.getElementById("camera");
const canvas = document.getElementById("output");
const ctx = canvas.getContext("2d");

const maskPicker = document.getElementById("maskColor");
const replacePicker = document.getElementById("replaceColor");
const thresholdSlider = document.getElementById("threshold");

let maskHue = rgbToHsv(hexToRGB(maskPicker.value))[0];
let replaceHue = rgbToHsv(hexToRGB(replacePicker.value))[0];
let hueDelta = deltaHue(maskHue, replaceHue);
let threshold = parseFloat(thresholdSlider.value);

maskPicker.addEventListener("input", e => {
  maskHue = rgbToHsv(hexToRGB(e.target.value))[0];
  hueDelta = deltaHue(maskHue, replaceHue);
});
replacePicker.addEventListener("input", e => {
  replaceHue = rgbToHsv(hexToRGB(e.target.value))[0];
  hueDelta = deltaHue(maskHue, replaceHue);
});
thresholdSlider.addEventListener("input", e => threshold = parseFloat(e.target.value));

// --- helpers ---
function hexToRGB(hex) {
  const i = parseInt(hex.slice(1), 16);
  return [(i >> 16) & 255, (i >> 8) & 255, i & 255];
}

function rgbToHsv([r,g,b]) {
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  const d=max-min;
  let h=0, s=max===0?0:d/max, v=max;
  if(d!==0){
    if(max===r) h=(g-b)/d+(g<b?6:0);
    else if(max===g) h=(b-r)/d+2;
    else h=(r-g)/d+4;
    h/=6;
  }
  return [h,s,v];
}

function hsvToRgb([h,s,v]){
  const i=Math.floor(h*6);
  const f=h*6-i;
  const p=v*(1-s);
  const q=v*(1-f*s);
  const t=v*(1-(1-f)*s);
  let r,g,b;
  switch(i%6){
    case 0:r=v;g=t;b=p;break;
    case 1:r=q;g=v;b=p;break;
    case 2:r=p;g=v;b=t;break;
    case 3:r=p;g=q;b=v;break;
    case 4:r=t;g=p;b=v;break;
    case 5:r=v;g=p;b=q;break;
  }
  return [r*255,g*255,b*255];
}

// Proper circular hue distance (0–0.5 range)
function hueDist(a,b){
  const diff=Math.abs(a-b);
  return diff>0.5?1-diff:diff;
}

// Proper circular hue delta
function deltaHue(from,to){
  let d=to-from;
  if(d>0.5) d-=1;
  if(d<-0.5) d+=1;
  return d;
}

async function startCamera(){
  try{
    const stream=await navigator.mediaDevices.getUserMedia({
      video:{facingMode:"environment"},
      audio:false
    });
    video.srcObject=stream;
    video.onloadedmetadata=()=>{
      canvas.width=video.videoWidth;
      canvas.height=video.videoHeight;
      render();
    };
  }catch(e){console.error(e);}
}

function render(){
  ctx.drawImage(video,0,0,canvas.width,canvas.height);
  const frame=ctx.getImageData(0,0,canvas.width,canvas.height);
  const data=frame.data;

  for(let i=0;i<data.length;i+=4){
    const hsv=rgbToHsv([data[i],data[i+1],data[i+2]]);
    if(hueDist(hsv[0],maskHue)<threshold){
      hsv[0]=(hsv[0]+hueDelta+1)%1;
      const [r,g,b]=hsvToRgb(hsv);
      data[i]=r; data[i+1]=g; data[i+2]=b;
    }
  }

  ctx.putImageData(frame,0,0);
  requestAnimationFrame(render);
}

startCamera();
