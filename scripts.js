const video = document.getElementById("camera");
const canvas = document.getElementById("output");
const ctx = canvas.getContext("2d");

const maskPicker = document.getElementById("maskColor");
const replacePicker = document.getElementById("replaceColor");
const thresholdSlider = document.getElementById("threshold");

let maskColor = hexToRGB(maskPicker.value);
let replaceColor = hexToRGB(replacePicker.value);
let threshold = parseFloat(thresholdSlider.value);

maskPicker.addEventListener("input", e => maskColor = hexToRGB(e.target.value));
replacePicker.addEventListener("input", e => replaceColor = hexToRGB(e.target.value));
thresholdSlider.addEventListener("input", e => threshold = parseFloat(e.target.value));

// Convert #rrggbb → [r,g,b]
function hexToRGB(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

// Start camera
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
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

function colorDistance(a, b) {
  return Math.sqrt(
    (a[0]-b[0])**2 +
    (a[1]-b[1])**2 +
    (a[2]-b[2])**2
  ) / 441.67295593; // Normalize 0–1 (sqrt(255^2*3))
}

function renderFrame() {
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = frame.data;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2];
    const dist = colorDistance([r,g,b], maskColor);
    if (dist < threshold) {
      d[i]   = replaceColor[0];
      d[i+1] = replaceColor[1];
      d[i+2] = replaceColor[2];
    }
  }

  ctx.putImageData(frame, 0, 0);
  requestAnimationFrame(renderFrame);
}

startCamera();
