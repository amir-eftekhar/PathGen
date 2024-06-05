/*document.getElementById('startTestBtn').onclick = function() {
    stopTestFlag = false; // Reset the stop flag when starting a new test
    startTest();
};

document.getElementById('stopTestBtn').onclick = function() {
    stopTestFlag = true;
};
*/
let stopTestFlag = false;

function startTest() {
    const robot = {
        x: -10,
        y: -40,
        theta: 90, // Start facing the top of the screen (90 degrees in the new system)
        width: Number(document.getElementById('robotWidthSlider').value),
        height: Number(document.getElementById('robotHeightSlider').value),
        speed: 1 // Speed factor for smooth movement
    };

    const points = [
        { x: -10, y: -40 },
        { x: 5, y: 30 },
        { x: -20, y: -30 },
        { x: -1, y: 50 },
        { x: 40, y: -10 },
        { x: 50, y: -30 },
        { x: 10, y: 60 }
    ];

    const totalTime = 30000; // total time in milliseconds to traverse the entire path
    const steps = 30000; // total number of steps for smooth animation
    const interval = totalTime / steps;

    let step = 0;
    let currentPointIndex = 0;

    function moveToNextPoint() {
        if (currentPointIndex < points.length - 1) {
            const startX = points[currentPointIndex].x;
            const startY = points[currentPointIndex].y;
            const endX = points[currentPointIndex + 1].x;
            const endY = points[currentPointIndex + 1].y;
            const startTheta = adjustAngle(robot.theta);
            const endTheta = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);

            const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
            const stepsToNextPoint = (distance / totalTime) * steps;

            function animateStep() {
                if (step <= stepsToNextPoint && !stopTestFlag) {
                    const progress = step / stepsToNextPoint;
                    robot.x = startX + (endX - startX) * progress;
                    robot.y = startY + (endY - startY) * progress;
                    robot.theta = interpolateAngle(startTheta, endTheta, progress);
                    renderRobot(robot);
                    step++;
                    requestAnimationFrame(animateStep);
                } else if (!stopTestFlag) {
                    robot.theta = endTheta; // Ensure final angle is set correctly
                    renderRobot(robot); // Render final position and angle
                    currentPointIndex++;
                    step = 0;
                    moveToNextPoint();
                }
            }

            animateStep();
        }
    }

    moveToNextPoint();
}

function adjustAngle(theta) {
    let adjustedTheta = theta - 90;
    if (adjustedTheta < -180) {
        adjustedTheta += 360;
    } else if (adjustedTheta > 180) {
        adjustedTheta -= 360;
    }
    return -adjustedTheta;
}

function interpolateAngle(startTheta, endTheta, progress) {
    let delta = endTheta - startTheta;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return startTheta + delta * progress;
}

function renderRobot(robot) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    render();
    ctx.save();
    ctx.translate(robot.x * imgPixelsPerInch + imgHalfActualWidth, imgActualWidth - robot.y * imgPixelsPerInch - imgHalfActualWidth);
    ctx.rotate((robot.theta * Math.PI) / 180);
    ctx.fillStyle = 'black';
    ctx.fillRect(-robot.width / 2, -robot.height / 2, robot.width, robot.height); // Adjust rectangle size based on sliders
    ctx.fillStyle = 'red';
    ctx.fillRect(-robot.width / 2, -robot.height / 2, robot.width, 5); // Draw the front side of the robot in red
    ctx.restore();
}
