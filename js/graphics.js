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

function getLineColor() {
  const movementType = document.getElementById('movementType').value;
  if (movementType === 'PID') {
    return 'orange';
  } else if (movementType === 'point') {
    return 'green';
  } else {
    return 'blue';
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


function getLineColor(movementType) {
  switch (movementType) {
    case 'PID':
      return 'orange';
    case 'point':
      return 'green';
    case 'turn':
      return 'red';
    default:
      return 'blue';
  }
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

  // Render path lines
  for (let i = 0; i < path.points.length - 1; i++) {
    const start = coordToPx(path.points[i]);
    const end = coordToPx(path.points[i + 1]);
    const movementType = path.movementTypes[i + 1];

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    
    if (movementType === 'point') {
      // Draw a straight line for 'point' type
      ctx.lineTo(end.x, end.y);
    } else {
      // Draw curved line for other types
      const control1 = coordToPx(path.splines[i].p1);
      const control2 = coordToPx(path.splines[i].p2);
      ctx.bezierCurveTo(control1.x, control1.y, control2.x, control2.y, end.x, end.y);
    }

    ctx.strokeStyle = getLineColor(movementType);
    ctx.lineWidth = lineWidth * imgPixelsPerInch;
    ctx.stroke();
  }

  // Render points
  path.points.forEach((point, index) => {
    const pxPoint = coordToPx(point);
    const movementType = path.movementTypes[index];

    ctx.beginPath();
    ctx.arc(pxPoint.x, pxPoint.y, pointRadius * imgPixelsPerInch, 0, 2 * Math.PI);
    ctx.fillStyle = getPointColor(movementType);
    ctx.fill();

    // Add visual indicator for turn points
    if (movementType === 'turn') {
      ctx.beginPath();
      ctx.moveTo(pxPoint.x, pxPoint.y);
      const angleRad = point.turnAngle * (Math.PI / 180);
      ctx.lineTo(pxPoint.x + Math.cos(angleRad) * 20, pxPoint.y + Math.sin(angleRad) * 20);
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });


  function getPointColor(movementType) {
    switch (movementType) {
      case 'turn':
        return 'darkred';
      case 'PID':
        return 'darkorange';
      case 'point':
        return 'darkgreen';
      default:
        return 'darkblue';
    }
  }


  // Render control points and lines
  path.splines.forEach(spline => {
    [spline.p0, spline.p1, spline.p2, spline.p3].forEach(p => {
      const pxPoint = coordToPx(p);
      ctx.beginPath();
      ctx.arc(pxPoint.x, pxPoint.y, controlPointRadius * imgPixelsPerInch, 0, 2 * Math.PI);
      ctx.fillStyle = controlPointColor;
      ctx.fill();
    });

    const start = coordToPx(spline.p0);
    const control1 = coordToPx(spline.p1);
    const control2 = coordToPx(spline.p2);
    const end = coordToPx(spline.p3);

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(control1.x, control1.y);
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(control2.x, control2.y);
    ctx.strokeStyle = controlLineColor;
    ctx.lineWidth = controlLineWidth * imgPixelsPerInch;
    ctx.stroke();
  });

  // Render other elements (Circles, Rectangles, SimpleText)
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
    }
  });

  SimpleText.instances.forEach(text => {
    if (text.visible) {
      const position = coordToPx(text.position);
      ctx.font = `${text.size * imgPixelsPerInch}px ${text.font}`;
      ctx.fillStyle = text.color;
      ctx.fillText(text.text, position.x, position.y);
    }
  });

  // Render cursor coordinates
  if (cursorCoordinates.visible) {
    ctx.font = `${cursorCoordinates.size}px ${cursorCoordinates.font}`;
    ctx.fillStyle = cursorCoordinates.color;
    ctx.fillText(cursorCoordinates.text, cursorCoordinates.position.x, cursorCoordinates.position.y);
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



function createAngleInputBox(position) {
  const angleInput = document.createElement('input');
  angleInput.classList.add('draggable'); 
  angleInput.type = 'number';
  angleInput.min = -180;
  angleInput.max = 180;
  angleInput.style.position = 'absolute';
  angleInput.style.left = `${window.innerWidth / 2}px`;
  angleInput.style.top = `${window.innerHeight / 2}px`;
  angleInput.style.zIndex = 1000;
  angleInput.style.width = '50px';
  angleInput.style.height = '20px';
  angleInput.style.background = 'white';
  angleInput.style.color = 'black';
  angleInput.style.border = '1px solid black';
  angleInput.style.pointerEvents = 'auto';
  angleInput.placeholder = 'Angle';

  angleInput.addEventListener('change', () => {
    const angle = parseFloat(angleInput.value);
    if (!isNaN(angle)) {
      const pointDistance = Number(document.getElementById('multiplierSlider').value);
      path.addPoint(position, 'turn', angle, pointDistance);
      path.update();
      angleInput.remove();
    }
  });

  makeElementDraggable(angleInput);

  return angleInput;
}


function makeElementDraggable(elm) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  let isDragging = false;

  elm.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    if (e.target.tagName.toLowerCase() === 'input' && !isDragging) {
      return;
    }
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elm.style.top = (elm.offsetTop - pos2) + "px";
    elm.style.left = (elm.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') {
      isDragging = true;
      elm.style.cursor = 'move';
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.key === 'd' || e.key === 'D') {
      isDragging = false;
      elm.style.cursor = 'default';
    }
  });
}
