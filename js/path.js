'use strict';

class Spline {
  constructor(p0, p1, p2, p3) {
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.points = [];
  }

  genPoints() {
    this.points = [];
    for (let t = 0; t <= 1; t += 0.01) {
      const x = (1 - t) ** 3 * this.p0.x + 3 * t * (1 - t) ** 2 * this.p1.x +
        3 * t ** 2 * (1 - t) * this.p2.x + t ** 3 * this.p3.x;
      const y = (1 - t) ** 3 * this.p0.y + 3 * t * (1 - t) ** 2 * this.p1.y +
        3 * t ** 2 * (1 - t) * this.p2.y + t ** 3 * this.p3.y;
      this.points.push(new Vector(x, y));
    }
  }
}

class Path {
  constructor(spline) {
    this.visible = true;
    this.splines = [spline];
    this.points = [];
    this.reverseMode = reverseMode;
    this.tempPoints = []; // List to temporarily store points
    this.newPoints = []; // List to store new points
    this.circles = []; // Initialize circles as an empty array
    this.lines = []; // Initialize lines as an empty array
    this.controlCircles = []; // Initialize controlCircles as an empty array
    this.controlLines = []; // Initialize controlLines as an empty array
    this.speedMode = 'calculated'; // Default to calculated speed mode
    this.update();
  }

  addPoint(point) {
    const p0 = this.splines[this.splines.length - 1].p3;
    const oldControl = this.splines[this.splines.length - 1].p2;
    const p1 = Vector.interpolate(Vector.distance(oldControl, p0) * 2, oldControl, p0);
    const p2 = Vector.interpolate(Math.min(Vector.distance(p0, point), Vector.distance(point, p1) / 1.333, 18), point, p1);
    const p3 = point;
    p3.reverse = reverseMode; // Mark the point with reverse mode status
    this.splines.push(new Spline(p0, p1, p2, p3));
    this.tempPoints.push(p3); // Add point to the temporary list
    this.newPoints.push(p3); // Add point to the new points list
    console.log('Added point:', p3);
    console.log('Current splines:', this.splines);
    console.log('Current tempPoints:', this.tempPoints);
    console.log('Current newPoints:', this.newPoints);
    this.update();
  }

  removePoint(pos) {
    if (this.splines.length > 1) {
      if (pos === 1) {
        this.splines.pop();
        this.tempPoints.pop(); // Remove point from the temporary list
        this.newPoints.pop(); // Remove point from the new points list
      } else if (pos === 0) {
        this.splines.shift();
        this.tempPoints.shift(); // Remove point from the temporary list
        this.newPoints.shift(); // Remove point from the new points list
      }
      console.log('Removed point at position:', pos);
      console.log('Current splines:', this.splines);
      console.log('Current tempPoints:', this.tempPoints);
      console.log('Current newPoints:', this.newPoints);
      this.update();
    }
  }

  calcVisuals() {
    this.circles.forEach(circle => circle.remove());
    this.circles = [];
    this.points.forEach(point => {
      const color = point.reverse ? hslToHex(60 + (point.data2 / maxSpeedSlider.value) * 30, 100, 50) : hslToHex(240 - (point.data2 / maxSpeedSlider.value) * 60, 100, 50);
      this.circles.push(new Circle(point, pointRadius, color, pointBorderWidth, color));
    });

    this.lines.forEach(line => line.remove());
    this.lines = [];
    for (let i = 0; i < this.circles.length - 1; i++) {
      this.lines.push(new Line(this.circles[i].center, this.circles[i + 1].center, lineWidth, this.points[i + 1].reverse ? 'yellow' : 'blue'));
    }

    this.controlCircles.forEach(circle => circle.remove());
    this.controlCircles = [];
    this.splines.forEach((spline, i) => {
      if (i === 0) this.controlCircles.push(new Circle(spline.p0, controlPointRadius, controlPointColor, controlPointBorderWidth, controlPointBorderColor));
      this.controlCircles.push(new Circle(spline.p1, controlPointRadius, controlPointColor, controlPointBorderWidth, controlPointBorderColor));
      this.controlCircles.push(new Circle(spline.p2, controlPointRadius, controlPointColor, controlPointBorderWidth, controlPointBorderColor));
      this.controlCircles.push(new Circle(spline.p3, controlPointRadius, controlPointColor, controlPointBorderWidth, controlPointBorderColor));
    });

    this.controlLines.forEach(line => line.remove());
    this.controlLines = [];
    this.splines.forEach(spline => {
      this.controlLines.push(new Line(spline.p0, spline.p1, controlLineWidth, controlLineColor));
      this.controlLines.push(new Line(spline.p2, spline.p3, controlLineWidth, controlLineColor));
    });
  }

 generateAutonomousPath() {
    let movements = [];
    let firstPoint = this.points[0];
    let secondPoint = this.points[1];
    let initialTheta = this.calculateTheta(firstPoint, secondPoint);
    movements.push(`odom->set_pose({${firstPoint.x.toFixed(1)}, ${firstPoint.y.toFixed(1)}, ${initialTheta.toFixed(1)}});`);

    for (let i = 1; i < this.points.length; i++) {
        let point = this.points[i];
        let theta = 0;
        if (i < this.points.length - 1) { 
            let nextPoint = this.points[i + 1];
            theta = this.calculateTheta(point, nextPoint);
        } else if (i === this.points.length - 1) {
            let prevPoint = this.points[i - 1];
            theta = prevPoint.theta;
        }
        point.theta = theta; 

        let flag;
        if (i === this.points.length - 1) {
            flag = point.reverse ? 'gfr::Flags::REVERSE' : 'gfr::Flags::NONE';
        } else {
            flag = point.reverse ? 'gfr::Flags::THRU | gfr::Flags::REVERSE' : 'gfr::Flags::THRU';
        }
        const speed = this.speedMode === 'constant' ? maxSpeedSlider.value : point.data2.toFixed(1);
        movements.push(`chassis.move({${point.x.toFixed(1)}, ${point.y.toFixed(1)}, ${theta.toFixed(1)}}, boomerang, ${speed}, ${flag});`);
    }
    console.log(movements.join('\n'));
}

 calculateTheta(point1, point2) {
  console.log(`calculating theta between ${point1.x}, ${point1.y} and ${point2.x}, ${point2.y}`);
    let deltaX = point2.x - point1.x;
    let deltaY = point2.y - point1.y;
    let theta = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    console.log(`deltaX: ${deltaX}, deltaY: ${deltaY}`);
    console.log(`theta: ${theta}`);
    if (deltaX >= 0 && deltaY >= 0) { 
      console.log('1st quadrant');
        theta = theta;
    } else if (deltaX < 0 && deltaY >= 0) { // 2nd quadrant
      console.log('2nd quadrant');
        theta = theta;
    } else if (deltaX < 0 && deltaY < 0) { // 3rd quadrant
      console.log('3rd quadrant');
        theta = 360 + theta;
    } else { // 4th quadrant
      console.log('4th quadrant');
        theta = 360 + theta;
    }

    // Adjust theta to be between 0 and 360
    if (theta < 0) {
        theta = 360 + theta;
    }

    return theta;
}
  generatePath() {
    this.update();
    this.generateAutonomousPath();
  }

  update() {
    clearHighlight();
    this.points = [];
    this.calcPoints();
    this.calcSpeed();
    this.spacePoints();
    this.calcDecel();
    this.calcVisuals();
  }

  setVisible(visible) {
    this.visible = visible;
    this.circles.forEach(circle => (circle.visible = visible));
    this.lines.forEach(line => (line.visible = visible));
    this.controlCircles.forEach(circle => (circle.visible = visible));
    this.controlLines.forEach(line => (line.visible = visible));
  }

  calcPoints() {
    this.tempPoints = [];
    this.splines.forEach((spline, i) => {
      spline.genPoints();
      if (i !== this.splines.length - 1) spline.points.pop();
      spline.points.forEach(point => {
        point.reverse = spline.p3.reverse; // Assign reverse flag to each generated point
      });
      this.tempPoints = this.tempPoints.concat(spline.points);
      spline.points = [];
    });

    let curDistance = 0;
    this.tempPoints.forEach((point, i) => {
      if (i === 0) {
        this.tempPoints[i].data = 0;
      } else {
        const dist = Vector.distance(this.tempPoints[i], this.tempPoints[i - 1]);
        curDistance += dist;
        this.tempPoints[i].data = curDistance;
      }
    });
  }

  calcDecel() {
    this.points[this.points.length - 1].data2 = 0;
    for (let i = this.points.length - 1; i > 0; i--) {
      const p0 = this.points[i];
      const p1 = this.points[i - 1];
      const dist = Vector.distance(p0, p1);
      const vel = Math.sqrt(p0.data2 ** 2 + 2 * decelerationSlider.value * dist);
      this.points[i - 1].data2 = Math.min(vel, p1.data2);
    }
  }

  calcSpeed() {
    this.tempPoints.forEach((p1, i) => {
      if (i < this.tempPoints.length - 1) {
        const p2 = this.tempPoints[i + 1];
        const dist = Vector.distance(p1, p2);
        const vel = Math.min(maxSpeedSlider.value, multiplierSlider.value * dist);
        this.tempPoints[i].data2 = vel;
        if (i === this.tempPoints.length - 2) {
          this.tempPoints[i + 1].data2 = vel;
        }
      }
    });
  }

  spacePoints() {
    let curDist = 0;
    this.tempPoints[0].data = 0;
    this.tempPoints.slice(1).forEach((p2, i) => {
      const p1 = this.tempPoints[i];
      const dist = Vector.distance(p1, p2);
      curDist += dist;
      this.tempPoints[i + 1].data = curDist;
    });

    const numPoints = Math.floor(curDist / spacing);
    const interval = 1 / numPoints;

    for (let T = 0; T < 1; T += interval) {
      const u = T * this.tempPoints[this.tempPoints.length - 1].data;
      let closestIndex = 0;
      for (let i = 0; i < this.tempPoints.length; i++) {
        if (this.tempPoints[i].data <= u) closestIndex = i;
      }

      if (this.tempPoints[closestIndex].data === u) {
        this.points.push(this.tempPoints[closestIndex]);
      } else {
        const p1 = this.tempPoints[closestIndex];
        const p2 = this.tempPoints[closestIndex + 1];
        const t = (u - p1.data) / (p2.data - p1.data);
        const x = p1.x + t * (p2.x - p1.x);
        const y = p1.y + t * (p2.y - p1.y);
        const p3 = new Vector(x, y, u);
        const dist1 = Vector.distance(p1, p3);
        const dist2 = Vector.distance(p2, p3);
        p3.data2 = dist1 < dist2 ? p1.data2 : p2.data2;
        p3.reverse = p1.reverse; // Keep the reverse flag
        this.points.push(p3);
      }
    }
    this.points.push(this.tempPoints[this.tempPoints.length - 1]);
    this.tempPoints = [];
  }

  setSpeedMode(mode) {
    this.speedMode = mode;
  }
}

function clearCanvas(reverseMode) {
  Line.instances = [];
  Circle.instances = [];
  Rectangle.instances = [];
  SimpleText.instances = SimpleText.instances.filter(text => text !== cursorCoordinates); // Preserve cursorCoordinates instance

  path = new Path(new Spline(new Vector(0, 0), new Vector(0, 0), new Vector(0, 0), new Vector(0, 0)), reverseMode);
  render();
}

document.getElementById('clearCanvasBtn').onclick = function() {
  clearCanvas(reverseMode);
};
