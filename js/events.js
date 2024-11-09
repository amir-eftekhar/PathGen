'use strict';

const canvasQuery = document.querySelector('canvas');
const highlightRect = new Rectangle(new Vector(0, 0), new Vector(0, 0), 'rgba(51, 51, 51, 0.705)');
let movement_type = 'regular';

function getCursorPosition(event) {
  const rect = canvasQuery.getBoundingClientRect();
  const mousePoint = pxToCoord(new Vector(event.clientX - rect.left, event.clientY - rect.top));
  return mousePoint;
}

function changeMovementMode() {
  movement_type = document.getElementById('movementType').value;
  console.log('movement_type is', movement_type);
}

let mode = 0;

let angleInputs = []; // Store references to angle input elements

function leftClick(event) {
  if (typeof mode === 'undefined') {
    mode = 0;
  }

  if (mode === 0) {
    changeMovementMode();
    console.log('movement_type = ', movement_type);
    clearHighlight();
    const mouse = getCursorPosition(event);
    let foundPoint = false;
    for (let i = 0; i < path.splines.length; i++) {
      const p0 = path.splines[i].p0;
      const p1 = path.splines[i].p1;
      const p2 = path.splines[i].p2;
      const p3 = path.splines[i].p3;
      if (Vector.distance(mouse, p0) < 5) {
        path.splines[i].p0.data = 1;
        foundPoint = true;
        break;
      } else if (Vector.distance(mouse, p1) < 5) {
        path.splines[i].p1.data = 1;
        foundPoint = true;
        break;
      } else if (Vector.distance(mouse, p2) < 5) {
        path.splines[i].p2.data = 1;
        foundPoint = true;
        break;
      } else if (Vector.distance(mouse, p3) < 5) {
        path.splines[i].p3.data = 1;
        foundPoint = true;
        break;
      }
    }

    if (!foundPoint) {
      const pointDistance = Number(document.getElementById('multiplierSlider').value);
      if (movement_type === 'regular') {
        path.addPoint(getCursorPosition(event), 'regular', 0, pointDistance);
      } else if (movement_type === 'point') {
        path.clearPoints();
        path.addPoint(getCursorPosition(event), 'point', 0, pointDistance);
      } else if (movement_type === 'PID') {
        path.addPoint(getCursorPosition(event), 'PID', 0, pointDistance);
      } else if (movement_type === 'turn') {
        const position = getCursorPosition(event);
        const angleInput = createAngleInputBox(position);
        document.body.appendChild(angleInput);
        angleInputs.push(angleInput); 
      }
    }
  }
}



// Clear canvas function to remove any remaining input boxes

function rightClick(event) {
  if (typeof mode === 'undefined') {
    mode = 0;
  }

  if (mode === 0) {
    clearHighlight();
    const mouse = getCursorPosition(event);
    const start = path.splines[0].p0;
    const end = path.splines[path.splines.length - 1].p3;
    if (Vector.distance(mouse, start) < 5) {
      path.removePoint(0);
    } else if (Vector.distance(mouse, end) < 5) {
      path.removePoint(1);
    }
    path.update();
  }
}

function leftDrag(event, start) {
  if (typeof mode === 'undefined') {
    mode = 0;
  }

  if (mode === 0) {
    const mouse = getCursorPosition(event);
    for (let i = 0; i < path.splines.length; i++) {
      if (path.splines[i].p0.data === 1) {
        const dx = mouse.x - path.splines[i].p0.x;
        const dy = mouse.y - path.splines[i].p0.y;
        path.splines[i].p0 = new Vector(mouse.x, mouse.y, 1);
        path.splines[i].p1.x += dx;
        path.splines[i].p1.y += dy;
        if (i > 0) {
          path.splines[i - 1].p2.x += dx;
          path.splines[i - 1].p2.y += dy;
          path.splines[i - 1].p3 = new Vector(mouse.x, mouse.y, 0);
        }
        path.movementTypes[i] = path.movementTypes[i] || 'regular'; // Preserve movement type
        path.update();
        break;
      } else if (path.splines[i].p1.data === 1) {
        path.splines[i].p1 = new Vector(mouse.x, mouse.y, 1);
        if (i > 0) {
          const dist = Vector.distance(path.splines[i].p1, path.splines[i].p0);
          path.splines[i - 1].p2 = Vector.interpolate(dist * 2, path.splines[i].p1, path.splines[i].p0);
        }
        path.update();
        break;
      } else if (path.splines[i].p2.data === 1) {
        path.splines[i].p2 = new Vector(mouse.x, mouse.y, 1);
        if (i < path.splines.length - 1) {
          const dist = Vector.distance(path.splines[i].p2, path.splines[i].p3);
          path.splines[i + 1].p1 = Vector.interpolate(dist * 2, path.splines[i].p2, path.splines[i].p3);
        }
        path.update();
        break;
      } else if (path.splines[i].p3.data === 1) {
        const dx = mouse.x - path.splines[i].p3.x;
        const dy = mouse.y - path.splines[i].p3.y;
        path.splines[i].p3 = new Vector(mouse.x, mouse.y, 1);
        path.splines[i].p2.x += dx;
        path.splines[i].p2.y += dy;
        if (i < path.splines.length - 1) {
          path.splines[i + 1].p0 = new Vector(mouse.x, mouse.y, 0);
          path.splines[i + 1].p1.x += dx;
          path.splines[i + 1].p1.y += dy;
        }
        path.update();
        break;
      }
    }
  }
}

function rightDrag(event, start) {
  if (typeof mode === 'undefined') {
    mode = 0;
  }

  if (mode === 0) {
    highlightRect.start = start;
    highlightRect.end = getCursorPosition(event);
    clearHighlight();
    for (let i = 0; i < path.circles.length; i++) {
      if (highlightRect.contains(path.circles[i])) {
        highlightList.push(i);
      }
    }
    for (let i = 0; i < highlightList.length; i++) {
      highlightCircles.push(new Circle(path.points[highlightList[i]], 1, 'rgba(51, 51, 51, 0)', 1, 'rgba(51, 51, 51, 0.705)'));
    }
  }
}

const mouseLabel = new SimpleText(new Vector(-70, -70), '0, 0', 'black', 4, 'Arial');

function mouseMove(event) {
  const mousePoint = getCursorPosition(event);
  mouseLabel.text = Math.round(mousePoint.x) + ', ' + Math.round(mousePoint.y);
}

function leftRelease(event) {
  if (typeof mode === 'undefined') {
    mode = 0;
  }

  if (mode === 0) {
    for (let i = 0; i < path.splines.length; i++) {
      path.splines[i].p0.data = 0;
      path.splines[i].p1.data = 0;
      path.splines[i].p2.data = 0;
      path.splines[i].p3.data = 0;
    }
  }
}

function rightRelease(event) {
  if (typeof mode === 'undefined') {
    mode = 0;
  }

  if (mode === 0) {
    highlightRect.start = new Vector(0, 0);
    highlightRect.end = new Vector(0, 0);

    if (highlightList.length > 0) {
      const mouse = getCursorPosition(event);
      const start = new Vector(mouse.x + 5, mouse.y + 10);
      const end = new Vector(start.x + 15, start.y - 10);
      newSpeedBox.start = start;
      newSpeedBox.end = end;
      newSpeedText.position = new Vector(start.x, start.y - 8);
      newSpeedText.text = '100';
    }
  }
}

document.onkeydown = function(event) {
  if (highlightList.length > 0) {
    if (event.key === 'Backspace') {
      if (newSpeedText.text !== '') {
        newSpeedText.text = newSpeedText.text.substr(0, newSpeedText.text.length - 1);
      }
    } else if (event.key === 'Enter') {
      for (let i = 0; i < highlightList.length; i++) {
        path.points[highlightList[i]].data2 *= (parseFloat(newSpeedText.text)) / 100;
      }
      path.calcDecel();
      path.calcVisuals();
      clearHighlight();
    } else {
      newSpeedText.text += event.key;
    }
  }
};

maxSpeedSlider.onchange = function() {
  path.update();
};

multiplierSlider.onchange = function() {
  path.update();
};

let leftDown = false;
let rightDown = false;
let leftDownStart = new Vector(0, 0);
let rightDownStart = new Vector(0, 0);

canvasQuery.onmousedown = function(event) {
  if (event.button === 0) {
    leftClick(event);
    leftDown = true;
    leftDownStart = getCursorPosition(event);
  } else if (event.button === 2) {
    rightClick(event);
    rightDown = true;
    rightDownStart = getCursorPosition(event);
  }
};

canvasQuery.onmouseup = function(event) {
  if (leftDown) {
    leftRelease(event);
  }
  if (rightDown) {
    rightRelease(event);
  }
  leftDown = false;
  rightDown = false;
};

canvasQuery.onmousemove = function(event) {
  if (leftDown) {
    leftDrag(event, leftDownStart);
  }
  if (rightDown) {
    rightDrag(event, rightDownStart);
  }
  mouseMove(event);
};

function clearHighlight() {
  highlightList = [];
  highlightCircles = [];
  newSpeedBox = { start: new Vector(0, 0), end: new Vector(0, 0) };
  newSpeedText.text = '';
}
