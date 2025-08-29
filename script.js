const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDiv = document.getElementById('score');
const restartBtn = document.getElementById('restartBtn');

let width, height;
function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}
window.addEventListener('resize', () => {
  resize();
  calcScale();
});
resize();

const DESIGN_WIDTH = 400;
const DESIGN_HEIGHT = 600;

// Bird properties (design scale)
const birdDesign = {
  x: 80,
  y: DESIGN_HEIGHT / 2,
  radius: 24,
  velocity: 0,
  gravity: 0.6,
  lift: -12
};

// Pipes properties (design scale)
const pipeWidthDesign = 60;
const pipeGapDesign = 250;
const pipeSpeedDesign = 3;

let pipes = [];
let score = 0;
let gameOver = false;

let scaleX, scaleY, scale;

const backgroundImg = new Image();
backgroundImg.src = 'background.jpg';

function calcScale() {
  scaleX = width / DESIGN_WIDTH;
  scaleY = height / DESIGN_HEIGHT;
  scale = Math.min(scaleX, scaleY);
}

calcScale();

function scaled(val) {
  return val * scale;
}

function createPipe() {
  const top = Math.random() * (DESIGN_HEIGHT - pipeGapDesign - 120) + 60;
  pipes.push({ x: DESIGN_WIDTH, top: top, passed: false });
}

function drawBackground() {
  ctx.drawImage(backgroundImg, 0, 0, width, height);
}

// Bird Draw 
let wingFlapAngle = 0;
let wingFlapSpeed = 0.15;

function drawBird() {
  const cx = scaled(birdDesign.x);
  const cy = scaled(birdDesign.y);
  const r = scaled(birdDesign.radius);

  // Update wing flap angle for animation
  wingFlapAngle += wingFlapSpeed;
  const wingFlapOffset = Math.sin(wingFlapAngle) * (r * 0.3);
  
  ctx.save();

  // Body gradient fill
  const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
  grad.addColorStop(0, '#ffd54f');   // bright yellow center
  grad.addColorStop(1, '#f57f17');   // deep orange edges
  ctx.fillStyle = grad;
  ctx.shadowColor = 'rgba(255, 210, 30, 0.8)';
  ctx.shadowBlur = 14;
  
  // Body circle
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.fill();

  // Wing flap (simple ellipse, animated)
  ctx.fillStyle = '#fbc02d';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.6, cy + wingFlapOffset, r * 0.35, r * 0.6, Math.sin(wingFlapAngle) * 0.5, 0, 2 * Math.PI);
  ctx.fill();

  // Eye white
  const eyeOffsetX = r * 0.35;
  const eyeOffsetY = -r * 0.25;
  const eyeRadius = r * 0.2;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(cx + eyeOffsetX, cy + eyeOffsetY, eyeRadius, eyeRadius * 1.3, 0, 0, 2 * Math.PI);
  ctx.fill();

  // Pupil with highlight
  ctx.fillStyle = '#3e2723';
  ctx.beginPath();
  ctx.ellipse(cx + eyeOffsetX + eyeRadius * 0.3, cy + eyeOffsetY, eyeRadius * 0.55, eyeRadius * 0.7, 0, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.ellipse(cx + eyeOffsetX + eyeRadius * 0.45, cy + eyeOffsetY - eyeRadius * 0.1, eyeRadius * 0.2, eyeRadius * 0.3, 0, 0, 2 * Math.PI);
  ctx.fill();

  // Beak top
  ctx.fillStyle = '#fb8c00';
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.65, cy + r * 0.1);
  ctx.lineTo(cx + r * 1.1, cy);
  ctx.lineTo(cx + r * 0.65, cy - r * 0.1);
  ctx.closePath();
  ctx.fill();

  // Beak bottom (shadow)
  ctx.fillStyle = '#e65100';
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.65, cy - r * 0.1);
  ctx.lineTo(cx + r * 0.75, cy - r * 0.05);
  ctx.lineTo(cx + r * 0.65, cy + r * 0.1);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Draw pipes with tree wood theme (bark colors & texture shading)
function drawPipes() {
  pipes.forEach(pipe => {
    const px = scaled(pipe.x);
    const pWidth = scaled(pipeWidthDesign);
    const pTop = scaled(pipe.top);
    const pGap = scaled(pipeGapDesign);
    const pHeight = scaled(DESIGN_HEIGHT);

    // Tree bark gradient colors
    const barkGradientTop = ctx.createLinearGradient(px, 0, px + pWidth, pTop);
    barkGradientTop.addColorStop(0, '#8B5A2B'); // dark brown
    barkGradientTop.addColorStop(0.5, '#A97449'); // lighter brown
    barkGradientTop.addColorStop(1, '#8B5A2B');

    const barkGradientBottom = ctx.createLinearGradient(px, pTop + pGap, px + pWidth, pHeight);
    barkGradientBottom.addColorStop(0, '#8B5A2B');
    barkGradientBottom.addColorStop(0.5, '#A97449');
    barkGradientBottom.addColorStop(1, '#8B5A2B');

    ctx.fillStyle = barkGradientTop;
    roundRect(ctx, px, 0, pWidth, pTop, scaled(12), true, true);

    ctx.fillStyle = barkGradientBottom;
    roundRect(ctx, px, pTop + pGap, pWidth, pHeight - pTop - pGap, scaled(12), true, true);

    // Light vertical streaks for rough bark texture top
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = scaled(2);
    for (let i = 3; i < pWidth; i += scaled(7)) {
      ctx.beginPath();
      ctx.moveTo(px + i, 0);
      ctx.lineTo(px + i, pTop);
      ctx.stroke();
    }

    // Light vertical streaks for rough bark texture bottom
    for (let i = 3; i < pWidth; i += scaled(7)) {
      ctx.beginPath();
      ctx.moveTo(px + i, pTop + pGap);
      ctx.lineTo(px + i, pHeight);
      ctx.stroke();
    }
  });
}

// Rounded rectangle helper
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke === 'undefined') stroke = true;
  if (typeof radius === 'undefined') radius = 5;

  if (typeof radius === 'number') {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
    for (const side in defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }

  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function checkCollision(pipe) {
  const birdRect = {
    left: scaled(birdDesign.x - birdDesign.radius),
    right: scaled(birdDesign.x + birdDesign.radius),
    top: scaled(birdDesign.y - birdDesign.radius),
    bottom: scaled(birdDesign.y + birdDesign.radius)
  };
  const pipeRectTop = {
    left: scaled(pipe.x),
    right: scaled(pipe.x + pipeWidthDesign),
    top: 0,
    bottom: scaled(pipe.top)
  };
  const pipeRectBottom = {
    left: scaled(pipe.x),
    right: scaled(pipe.x + pipeWidthDesign),
    top: scaled(pipe.top + pipeGapDesign),
    bottom: scaled(DESIGN_HEIGHT)
  };

  if (
    birdRect.right > pipeRectTop.left &&
    birdRect.left < pipeRectTop.right &&
    birdRect.top < pipeRectTop.bottom
  ) return true;

  if (
    birdRect.right > pipeRectBottom.left &&
    birdRect.left < pipeRectBottom.right &&
    birdRect.bottom > pipeRectBottom.top
  ) return true;

  return false;
}

function update() {
  birdDesign.velocity += birdDesign.gravity;
  birdDesign.y += birdDesign.velocity;

  // Boundaries
  if (birdDesign.y + birdDesign.radius > DESIGN_HEIGHT) {
    birdDesign.y = DESIGN_HEIGHT - birdDesign.radius;
    gameOver = true;
  }
  if (birdDesign.y - birdDesign.radius < 0) {
    birdDesign.y = birdDesign.radius;
    birdDesign.velocity = 0;
  }

  pipes.forEach(pipe => {
    pipe.x -= pipeSpeedDesign;

    if (checkCollision(pipe)) {
      gameOver = true;
    }

    if (!pipe.passed && pipe.x + pipeWidthDesign < birdDesign.x - birdDesign.radius) {
      pipe.passed = true;
      score++;
      scoreDiv.textContent = `Score: ${score}`;
    }
  });

  pipes = pipes.filter(pipe => pipe.x + pipeWidthDesign > 0);

  if (pipes.length === 0 || pipes[pipes.length - 1].x < DESIGN_WIDTH - 200) {
    createPipe();
  }
}

function gameLoop() {
  drawBackground();
  drawPipes();
  drawBird();
  update();

  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#fff";
    ctx.font = `${scaled(48)}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("Game Over", width / 2, height / 2 - scaled(20));
    ctx.font = `${scaled(32)}px Arial`;
    ctx.fillText(`Score: ${score}`, width / 2, height / 2 + scaled(40));
    restartBtn.style.display = "block";
    return;
  }

  requestAnimationFrame(gameLoop);
}

function flap() {
  if (!gameOver) {
    birdDesign.velocity = birdDesign.lift;
  }
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") {
    flap();
  }
});
canvas.addEventListener("click", flap);

// Added touch event listener for mobile
canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  flap();
}, { passive: false });

restartBtn.addEventListener("click", () => {
  birdDesign.y = DESIGN_HEIGHT / 2;
  birdDesign.velocity = 0;
  pipes = [];
  score = 0;
  gameOver = false;
  scoreDiv.textContent = "Score: 0";
  restartBtn.style.display = "none";
  createPipe();
  gameLoop();
});

let imagesLoaded = 0;
function onImageLoad() {
  imagesLoaded++;
  if (imagesLoaded === 1) {  // only bg image
    createPipe();
    gameLoop();
  }
}
backgroundImg.onload = onImageLoad;
