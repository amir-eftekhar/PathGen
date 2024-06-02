'use strict';

const canvas = document.getElementById('fieldCanvas');
const ctx = canvas.getContext('2d');

const imgActualWidth = Number(canvas.attributes.width.value);
const imgHalfActualWidth = imgActualWidth / 2;
const imgPixelsPerInch = imgActualWidth / 144;

class Line {
  static instances = [];
  constructor(start, end, width = 1, color = 'black', visible = true) {
    this.start = start;
    this.end = end;
    this.width = width;
    this.color = color;
    this.visible = visible;
    this.index = Line.instances.length;
    Line.instances.push(this);
  }
  remove() {
    Line.instances.splice(this.index, 1);
    for (let i = this.index; i < Line.instances.length; i++) {
      Line.instances[i].index--;
    }
  }
}

class Rectangle {
  static instances = [];
  constructor(start, end, color = 'black', borderWidth = 0, borderColor = 'black', visible = true) {
    this.start = start;
    this.end = end;
    this.color = color;
    this.borderWidth = borderWidth;
    this.borderColor = borderColor;
    this.visible = visible;
    this.index = Rectangle.instances.length;
    Rectangle.instances.push(this);
  }
  contains(shape) {
    const left = Math.min(this.start.x, this.end.x);
    const right = Math.max(this.start.x, this.end.x);
    const bottom = Math.min(this.start.y, this.end.y);
    const top = Math.max(this.start.y, this.end.y);
    return shape.center.x > left && shape.center.x < right && shape.center.y > bottom && shape.center.y < top;
  }
  remove() {
    Rectangle.instances.splice(this.index, 1);
    for (let i = this.index; i < Rectangle.instances.length; i++) {
      Rectangle.instances[i].index--;
    }
  }
}

class Circle {
  static instances = [];
  constructor(center, radius, color = 'black', borderWidth = 0, borderColor = 'black', visible = true) {
    this.center = center;
    this.radius = radius;
    this.color = color;
    this.borderWidth = borderWidth;
    this.borderColor = borderColor;
    this.visible = visible;
    this.index = Circle.instances.length;
    Circle.instances.push(this);
  }
  remove() {
    Circle.instances.splice(this.index, 1);
    for (let i = this.index; i < Circle.instances.length; i++) {
      Circle.instances[i].index--;
    }
  }
}

class SimpleText {
  static instances = [];
  constructor(position, text, color = 'black', size = 12, font = 'Arial', visible = true) {
    this.position = position;
    this.text = text;
    this.color = color;
    this.size = size;
    this.font = font;
    this.visible = visible;
    this.index = SimpleText.instances.length;
    SimpleText.instances.push(this);
  }
  remove() {
    SimpleText.instances.splice(this.index, 1);
    for (let i = this.index; i < SimpleText.instances.length; i++) {
      SimpleText.instances[i].index--;
    }
  }
}

function pxToCoord(point) {
  const newPoint = new Vector(point.x, point.y);
  newPoint.x = (newPoint.x - imgHalfActualWidth) / imgPixelsPerInch;
  newPoint.y = (imgActualWidth - newPoint.y - imgHalfActualWidth) / imgPixelsPerInch;
  return newPoint;
}

function coordToPx(point) {
  const newPoint = new Vector(point.x, point.y);
  newPoint.x = newPoint.x * imgPixelsPerInch + imgHalfActualWidth;
  newPoint.y = imgActualWidth - newPoint.y * imgPixelsPerInch - imgHalfActualWidth;
  return newPoint;
}

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

  // Render cursor coordinates
  if (cursorCoordinates.visible) {
    ctx.beginPath();
    ctx.font = `${cursorCoordinates.size}px ${cursorCoordinates.font}`;
    ctx.fillStyle = cursorCoordinates.color;
    ctx.fillText(cursorCoordinates.text, cursorCoordinates.position.x, cursorCoordinates.position.y);
    ctx.closePath();
  }
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

const newSpeedBox = new Rectangle(new Vector(0, 0), new Vector(0, 0), 'rgb(177, 127, 238)');
const cursorCoordinates = new SimpleText(new Vector(10, canvas.height - 10), '', 'black', 12, 'Arial', true);

canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  const coord = pxToCoord(new Vector(mouseX, mouseY));
  cursorCoordinates.text = `X: ${coord.x.toFixed(2)}, Y: ${coord.y.toFixed(2)}`;
  render();
});

function clearHighlight() {
  highlightList = [];
  while (highlightCircles.length > 0) {
    highlightCircles.pop().remove();
  }
  newSpeedBox.start = new Vector(0, 0);
  newSpeedBox.end = new Vector(0, 0);
  newSpeedText.text = '';
}
