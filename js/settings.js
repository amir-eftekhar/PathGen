/**
 * Global objects
 */

let maxSpeedSlider = document.getElementById('maxSpeedSlider');
let multiplierSlider = document.getElementById('multiplierSlider');

let decelerationText = document.getElementById('decelVal');
let maxSpeedText = document.getElementById('maxSpeedVal');
let multiplierText = document.getElementById('multiplierVal');
const calcRadiusOrientationSlider = document.getElementById('calcRadiusOrientation');
const calcRadiusOrientationOutput = document.getElementById('calcRadiusOrientationOutput');
const wheelRadiusSlider = document.getElementById('wheelRadius');
const wheelRadiusOutput = document.getElementById('wheelRadiusOutput');
const frictionCoefficientSlider = document.getElementById('frictionCoefficient');
const frictionCoefficientOutput = document.getElementById('frictionCoefficientOutput');
const maxRPMSlider = document.getElementById('maxRPM');
const maxRPMOutput = document.getElementById('maxRPMOutput');

calcRadiusOrientationSlider.oninput = function() {
    calcRadiusOrientationOutput.value = this.value;
}

wheelRadiusSlider.oninput = function() {
    wheelRadiusOutput.value = this.value;
}

frictionCoefficientSlider.oninput = function() {
    frictionCoefficientOutput.value = this.value;
}

maxRPMSlider.oninput = function() {
    maxRPMOutput.value = this.value;
}


let path;
let highlightList = [];
let highlightCircles = [];

/**
 * Path settings
 */
let spacing = 10; // Initial value for spacing

function updateSpacing(value) {
  spacing = parseFloat(value);
  document.getElementById('multiplierValue').textContent = value;
}

/**
 * Graphics settings
 */
const imgTrueWidth = 144; // the width of the image in inches
const img = new Image; // background image
img.src = 'field.png';
const fps = 60; // how many frames to render each second

/**
 * Accessibility settings
 */
const pointRadius = 1;
const pointBorderWidth = 0;
const lineWidth = 1;
const controlPointColor = 'rgba(50, 161, 68, 0.452)';
const controlPointRadius = 5;
const controlPointBorderColor = 'rgba(50, 161, 68, 0.452)';
const controlPointBorderWidth = 0;
const controlLineWidth = 0.5;
const controlLineColor = 'black';
let reverseMode = false;

const reverseBtn = document.getElementById('reverseBtn');
reverseBtn.onclick = function() {

  reverseMode = !reverseMode;
  console.log(`reverseMode: ${reverseMode}`);
  reverseBtn.classList.toggle('bg-red-600', reverseMode);
  reverseBtn.classList.toggle('bg-red-300', !reverseMode);
  reverseBtn.innerText = reverseMode ? 'Reverse Mode On' : 'Reverse Mode Off';
};

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);

  Line.instances.forEach(line => {
    if (line.visible) {
      const start = coordToPx(line.start);
      const end = coordToPx(line.end);
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.lineWidth = line.width * imgPixelsPerInch;
      ctx.strokeStyle = line.color;
      ctx.stroke();
      ctx.closePath();
    }
  });

  Circle.instances.forEach(circle => {
    if (circle.visible) {
      const center = coordToPx(circle.center);
      ctx.beginPath();
      ctx.arc(center.x, center.y, circle.radius * imgPixelsPerInch, 0, 2 * Math.PI);
      ctx.fillStyle = circle.color;
      ctx.fill();
      if (circle.borderWidth !== 0) {
        ctx.lineWidth = circle.borderWidth * imgPixelsPerInch;
        ctx.strokeStyle = circle.borderColor;
        ctx.stroke();
      }
      ctx.closePath();
    }
  });

  Rectangle.instances.forEach(rect => {
    if (rect.visible) {
      const start = coordToPx(rect.start);
      const end = coordToPx(rect.end);
      ctx.beginPath();
      ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
      ctx.fillStyle = rect.color;
      ctx.fill();
      if (rect.borderWidth !== 0) {
        ctx.lineWidth = rect.borderWidth * imgPixelsPerInch;
        ctx.strokeStyle = rect.borderColor;
        ctx.stroke();
      }
      ctx.closePath();
    }
  });

  SimpleText.instances.forEach(text => {
    if (text.visible) {
      const position = coordToPx(text.position);
      ctx.beginPath();
      ctx.font = `${text.size * imgPixelsPerInch}px ${text.font}`;
      ctx.fillStyle = text.color;
      ctx.fillText(text.text, position.x, position.y);
      ctx.closePath();
    }
  });
}

function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

if (typeof newSpeedBox === 'undefined') {
  const newSpeedBox = new Rectangle(new Vector(0, 0), new Vector(0, 0), 'rgb(177, 127, 238)');
}
const newSpeedText = new SimpleText(new Vector(0, 0), '', 'black', 8);

function clearHighlight() {
  highlightList = [];
  while (highlightCircles.length > 0) {
    highlightCircles.pop().remove();
  }
  newSpeedBox.start = new Vector(0, 0);
  newSpeedBox.end = new Vector(0, 0);
  newSpeedText.text = '';
}
