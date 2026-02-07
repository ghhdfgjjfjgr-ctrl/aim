const aiPrompt = document.getElementById("aiPrompt");
const aiGenerate = document.getElementById("aiGenerate");
const aiApply = document.getElementById("aiApply");
const aiOutput = document.getElementById("aiOutput");
const frameDisplay = document.getElementById("frameDisplay");
const togglePlayback = document.getElementById("togglePlayback");
const exportFrame = document.getElementById("exportFrame");
const addKeyframe = document.getElementById("addKeyframe");
const clearKeyframes = document.getElementById("clearKeyframes");
const posX = document.getElementById("posX");
const posY = document.getElementById("posY");
const scale = document.getElementById("scale");
const rotation = document.getElementById("rotation");

const canvas = document.getElementById("animeCanvas");
const ctx = canvas.getContext("2d");

const totalFrames = 60;
let currentFrame = 1;
let isPlaying = false;
let rafId = null;

const state = {
  x: Number(posX.value),
  y: Number(posY.value),
  scale: Number(scale.value),
  rotation: Number(rotation.value),
};

let keyframes = [
  { frame: 1, ...state },
  { frame: 24, x: 540, y: 220, scale: 1.1, rotation: -6 },
  { frame: 48, x: 340, y: 250, scale: 0.95, rotation: 8 },
];

const suggestions = [
  {
    title: "ท่าทางชิบิแบบสดใส",
    detail: "เพิ่มการเด้งของหัวในเฟรม 6-12 และเติมเอฟเฟกต์ประกายดาวรอบตัวละคร",
  },
  {
    title: "กล้อง 2D Dolly",
    detail: "เลื่อนกล้องเข้า 8% พร้อม ease-in เพื่อเน้นจังหวะโชว์อารมณ์",
  },
  {
    title: "เส้นสปีดไลน์",
    detail: "เติมสปีดไลน์ด้านหลังในเฟรม 10-14 และลด opacity เพื่อไม่แย่งตัวละคร",
  },
];

const tracks = {
  cameraTrack: [6, 18, 30, 42, 54],
  characterTrack: keyframes.map((frame) => frame.frame),
  lightTrack: [12, 36, 48],
};

const resizeCanvas = () => {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
};

const updateFrameDisplay = (frame) => {
  frameDisplay.textContent = `Frame ${String(frame).padStart(3, "0")}`;
};

const renderTrack = (trackId, activeFrames) => {
  const track = document.getElementById(trackId);
  const maxFrames = totalFrames;
  track.innerHTML = "";

  for (let i = 1; i <= maxFrames; i += 1) {
    const frame = document.createElement("div");
    frame.className = "frame";
    if (activeFrames.includes(i)) {
      frame.classList.add("active");
    }
    frame.dataset.frame = i;
    frame.addEventListener("mouseenter", () => updateFrameDisplay(i));
    frame.addEventListener("click", () => {
      currentFrame = i;
      applyPose(getPoseAtFrame(currentFrame));
      drawScene();
    });
    track.appendChild(frame);
  }
};

const refreshTracks = () => {
  tracks.characterTrack = keyframes.map((frame) => frame.frame);
  Object.entries(tracks).forEach(([trackId, frames]) => {
    renderTrack(trackId, frames);
  });
};

const applyPose = (pose) => {
  state.x = pose.x;
  state.y = pose.y;
  state.scale = pose.scale;
  state.rotation = pose.rotation;
  posX.value = state.x;
  posY.value = state.y;
  scale.value = state.scale;
  rotation.value = state.rotation;
};

const interpolate = (start, end, t) => start + (end - start) * t;

const getPoseAtFrame = (frame) => {
  if (keyframes.length === 0) {
    return { ...state };
  }

  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  if (frame <= first.frame) {
    return first;
  }
  if (frame >= last.frame) {
    return last;
  }

  const nextIndex = sorted.findIndex((item) => item.frame >= frame);
  const prev = sorted[nextIndex - 1];
  const next = sorted[nextIndex];
  const progress = (frame - prev.frame) / (next.frame - prev.frame);

  return {
    frame,
    x: interpolate(prev.x, next.x, progress),
    y: interpolate(prev.y, next.y, progress),
    scale: interpolate(prev.scale, next.scale, progress),
    rotation: interpolate(prev.rotation, next.rotation, progress),
  };
};

const drawCharacter = () => {
  const { x, y, scale: scaleValue, rotation: rotationValue } = state;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotationValue * Math.PI) / 180);
  ctx.scale(scaleValue, scaleValue);

  // Body
  ctx.fillStyle = "#ffd1e8";
  ctx.beginPath();
  ctx.ellipse(0, 60, 36, 44, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = "#ffe6f2";
  ctx.beginPath();
  ctx.arc(0, 0, 52, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = "#3a2a6a";
  ctx.beginPath();
  ctx.arc(0, -12, 56, Math.PI, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = "#3b1f5f";
  ctx.beginPath();
  ctx.ellipse(-18, -6, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(18, -6, 8, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Highlights
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-16, -10, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(20, -10, 3, 0, Math.PI * 2);
  ctx.fill();

  // Blush
  ctx.fillStyle = "rgba(255, 125, 171, 0.6)";
  ctx.beginPath();
  ctx.ellipse(-28, 10, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(28, 10, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  ctx.strokeStyle = "#b3517c";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 16, 8, 0, Math.PI);
  ctx.stroke();

  ctx.restore();
};

const drawBackground = (width, height) => {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  for (let i = 0; i < 8; i += 1) {
    ctx.fillRect(40 + i * 90, 30, 2, height / 2.5);
  }
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 20, width - 40, height - 40);
};

const drawProps = (width, height) => {
  const baseY = height - 140;

  // Shop
  ctx.fillStyle = "#ffb6d9";
  ctx.fillRect(60, baseY, 180, 110);
  ctx.fillStyle = "#f26aa6";
  ctx.fillRect(60, baseY - 28, 180, 28);
  ctx.fillStyle = "#3b1f5f";
  ctx.fillRect(90, baseY + 28, 50, 60);
  ctx.fillStyle = "#ffe6f2";
  ctx.fillRect(150, baseY + 20, 70, 40);
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "12px sans-serif";
  ctx.fillText("Kawaii Shop", 95, baseY - 10);

  // Tower
  ctx.fillStyle = "#7a7be8";
  ctx.fillRect(width - 200, baseY - 60, 120, 170);
  ctx.fillStyle = "#4a4cb0";
  ctx.fillRect(width - 200, baseY - 90, 120, 30);
  ctx.fillStyle = "#ffe6f2";
  ctx.fillRect(width - 175, baseY - 30, 30, 30);
  ctx.fillRect(width - 135, baseY + 10, 30, 30);

  // Street props
  ctx.fillStyle = "#ffd1e8";
  ctx.beginPath();
  ctx.arc(width / 2 + 140, baseY + 70, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3a2a6a";
  ctx.fillRect(width / 2 + 132, baseY + 45, 16, 50);
  ctx.fillStyle = "#ffe6f2";
  ctx.beginPath();
  ctx.arc(width / 2 + 140, baseY + 45, 18, 0, Math.PI * 2);
  ctx.fill();
};

const drawScene = () => {
  const { width, height } = canvas.getBoundingClientRect();
  drawBackground(width, height);
  drawProps(width, height);
  drawCharacter();
};

const populateOutput = (prompt) => {
  aiOutput.innerHTML = "";

  const header = document.createElement("div");
  header.textContent = `AI สรุปคำสั่ง: "${prompt}"`;
  header.className = "ai-suggestion";
  aiOutput.appendChild(header);

  suggestions.forEach((item) => {
    const card = document.createElement("div");
    card.className = "ai-suggestion";
    card.innerHTML = `<strong>${item.title}</strong><p>${item.detail}</p>`;
    aiOutput.appendChild(card);
  });
};

const addKeyframeAtCurrent = () => {
  const existing = keyframes.find((item) => item.frame === currentFrame);
  if (existing) {
    Object.assign(existing, { ...state });
  } else {
    keyframes.push({ frame: currentFrame, ...state });
  }
  refreshTracks();
};

const clearAllKeyframes = () => {
  keyframes = [];
  refreshTracks();
};

const handleAIApply = () => {
  const prompt = aiPrompt.value.trim();
  if (!prompt) {
    aiOutput.innerHTML = "<div class=\"placeholder\">กรุณาใส่คำสั่งเพื่อให้ AI สร้างไอเดีย</div>";
    return;
  }

  const basePose = getPoseAtFrame(currentFrame);
  const nextFrame = Math.min(totalFrames, currentFrame + 12);
  const newPose = { ...basePose };

  if (prompt.includes("ซ้าย")) newPose.x = 220;
  if (prompt.includes("ขวา")) newPose.x = 640;
  if (prompt.includes("กลาง")) newPose.x = 430;
  if (prompt.includes("กระโดด")) newPose.y = 140;
  if (prompt.includes("ก้ม")) newPose.y = 300;
  if (prompt.includes("ชิบิ")) newPose.scale = 1.25;
  if (prompt.includes("หมุน")) newPose.rotation = 12;

  keyframes.push({ frame: currentFrame, ...basePose });
  keyframes.push({ frame: nextFrame, ...newPose });
  refreshTracks();
  applyPose(getPoseAtFrame(currentFrame));
  drawScene();
};

const togglePlay = () => {
  isPlaying = !isPlaying;
  togglePlayback.textContent = isPlaying ? "Pause" : "Play";

  if (isPlaying) {
    const step = () => {
      currentFrame = currentFrame >= totalFrames ? 1 : currentFrame + 1;
      updateFrameDisplay(currentFrame);
      applyPose(getPoseAtFrame(currentFrame));
      drawScene();
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
  } else if (rafId) {
    cancelAnimationFrame(rafId);
  }
};

const exportCurrentFrame = () => {
  const link = document.createElement("a");
  link.download = `aimotion-frame-${String(currentFrame).padStart(3, "0")}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
};

[posX, posY, scale, rotation].forEach((input) => {
  input.addEventListener("input", () => {
    state.x = Number(posX.value);
    state.y = Number(posY.value);
    state.scale = Number(scale.value);
    state.rotation = Number(rotation.value);
    drawScene();
  });
});

aiGenerate.addEventListener("click", () => {
  const prompt = aiPrompt.value.trim();
  if (!prompt) {
    aiOutput.innerHTML = "<div class=\"placeholder\">กรุณาใส่คำสั่งเพื่อให้ AI สร้างไอเดีย</div>";
    return;
  }

  populateOutput(prompt);
});

aiApply.addEventListener("click", handleAIApply);
addKeyframe.addEventListener("click", addKeyframeAtCurrent);
clearKeyframes.addEventListener("click", clearAllKeyframes);
togglePlayback.addEventListener("click", togglePlay);
exportFrame.addEventListener("click", exportCurrentFrame);

window.addEventListener("resize", () => {
  resizeCanvas();
  drawScene();
});

resizeCanvas();
refreshTracks();
applyPose(getPoseAtFrame(currentFrame));
updateFrameDisplay(currentFrame);
drawScene();
