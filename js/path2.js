'use strict';

class ExtendedPath extends Path {
  constructor(spline) {
    super(spline);
  }

  generateAutonomousPath2() {
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

      const speed = this.calculateSpeed(i);

      movements.push(`chassis.move({${point.x.toFixed(1)}, ${point.y.toFixed(1)}, ${theta.toFixed(1)}}, boomerang, ${speed.toFixed(1)}, ${flag});`);
    }

    const generatedCode = movements.join('\n');
    console.log(generatedCode);

    document.getElementById('generatedCodeArea').value = generatedCode;
  }

  calculateSpeed(index) {
    const radius = 15; // 15-inch radius
    const maxSpeed = Number(document.getElementById('maxSpeedSlider').value);
    const minSpeed = maxSpeed / 2;

    let pointsInRange = this.findPointsInRange(this.points[index], radius);
    let secondDerivative = this.calculateSecondDerivative(pointsInRange);

    let curvatureFactor = Math.min(Math.max(secondDerivative, 0), 1);
    let speed = maxSpeed - (curvatureFactor * (maxSpeed - minSpeed));
    return speed;
  }

  findPointsInRange(centerPoint, radius) {
    return this.points.filter(point => {
      let distance = Vector.distance(centerPoint, point);
      return distance <= radius;
    });
  }

  calculateSecondDerivative(points) {
    if (points.length < 3) return 0;

    let firstDerivatives = [];
    for (let i = 0; i < points.length - 1; i++) {
      let dx = points[i + 1].x - points[i].x;
      let dy = points[i + 1].y - points[i].y;
      firstDerivatives.push({ dx, dy });
    }

    let secondDerivatives = [];
    for (let i = 0; i < firstDerivatives.length - 1; i++) {
      let ddx = firstDerivatives[i + 1].dx - firstDerivatives[i].dx;
      let ddy = firstDerivatives[i + 1].dy - firstDerivatives[i].dy;
      secondDerivatives.push(Math.sqrt(ddx * ddx + ddy * ddy));
    }

    return Math.max(...secondDerivatives);
  }
}

// Use the ExtendedPath class instead of the original Path class
/*document.getElementById('generatePathBtn').onclick = function() {
  const spline = new Spline(new Vector(0, 0), new Vector(0, 0), new Vector(0, 0), new Vector(0, 0));
  const path = new ExtendedPath(spline);
  path.generatePath();
};
*/