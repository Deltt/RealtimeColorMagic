const video = document.getElementById("camera");
const canvas = document.getElementById("output");
const ctx = canvas.getContext("2d");

const maskPicker = document.getElementById("maskColor");
const replacePicker = document.getElementById("replaceColor");
const thresholdSlider = document.getElementById("threshold");

let maskHue = rgbToHsv(hexToRGB(maskPicker.value))[0];
let replaceHue = rgbToHsv(hexToRGB(replacePicker.value))[0];
let hueDelta = (replaceHue - maskHue + 1) % 1; // hue shift amount
let threshold = parseFloat(thresholdSlider.value);

maskPicker.addEventListener("input", e => {
  maskHue = rgbToHsv(hexToRGB(e.target.value))[0];
  hueDelta = (replaceHue - maskHue + 1) % 1;
});
replacePicker.addEventListener("input", e => {
  replaceHue = rgbToHsv(hexToRGB(e.target.value))[0];
  hueDelta = (replaceHue - maskHue + 1) % 1;
});
thresholdSlider.addEventListener("input", e => {
  threshold = parseFloat(e.target.value);
});

// Convert hex → [r,g,b]
function hexToRGB(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

// RGB <-> HSV conversions
function rgbToHsv([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0, s = max === 0 ? 0 : d / max, v = max;

  if (d !== 0) {
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, v];
}

function hsvToRgb([h, s, v]) {
  let r, g, b;
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return [r * 255, g * 255, b * 255];
}

// Start camera
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      renderFrame();
    };
  } catch (err) {
    console.error("Camera error:", err);
  }
}

// Hue difference (wrap-around)
function hueDistance(a, b) {
  const diff = Math.abs(a - b);
  return Math.min(diff, 1 - diff);
}

function renderFrame() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = frame.data;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2];
    const hsv = rgbToHsv([r, g, b]);
    const dist = hueDistance(hsv[0], maskHue);

    if (dist < threshold) {
      // Rotate hue by hueDelta instead of overwriting
      hsv[0] = (hsv[0] + hueDelta) % 1;
      const [nr, ng, nb] = hsvToRgb(hsv);
      d[i] = nr; d[i+1] = ng; d[i+2] = nb;
    }
  }

  ctx.putImageData(frame, 0, 0);
  requestAnimationFrame(renderFrame);
}

startCamera();
