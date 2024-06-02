document.getElementById('speedMode').onchange = function(event) {
    path.setSpeedMode(event.target.value);
};

document.getElementById('startSimBtn').onclick = function() {
    const code = document.getElementById('codeArea').value;
    startSimulation(code);
};

function startSimulation(code) {
    const commands = code.split('\n').filter(cmd => cmd.trim().length > 0);
    let commandIndex = 0;

    const robot = {
        x: 0,
        y: 0,
        theta: 0,
        width: Number(document.getElementById('robotWidthSlider').value),
        height: Number(document.getElementById('robotHeightSlider').value),
        speed: 100
    };

    function parseCommand(command) {
        if (command.startsWith('odom->set_pose')) {
            const match = command.match(/odom->set_pose\(\{([^}]+)\}\)/);
            if (match) {
                const [x, y, theta] = match[1].split(',').map(Number);
                return { type: 'set_pose', x, y, theta };
            }
        } else if (command.startsWith('chassis.move')) {
            const match = command.match(/chassis.move\(\{([^}]+)\},[^,]+,([^,]+),([^,]+)\)/);
            if (match) {
                const [x, y, theta] = match[1].split(',').map(Number);
                const speed = Number(match[2]);
                return { type: 'move', x, y, theta, speed };
            }
        }
        return null;
    }

    function executeCommand(command) {
        if (!command) return;
        
        if (command.type === 'set_pose') {
            robot.x = command.x;
            robot.y = command.y;
            robot.theta = command.theta;
            renderRobot(robot);
            commandIndex++;
            if (commandIndex < commands.length) {
                setTimeout(() => executeCommand(parseCommand(commands[commandIndex])), 500);
            }
        } else if (command.type === 'move') {
            const startX = robot.x;
            const startY = robot.y;
            const startTheta = robot.theta;
            const endX = command.x;
            const endY = command.y;
            const endTheta = command.theta;
            const speed = command.speed;

            const totalTime = 2000; // 2 seconds per movement
            const steps = 100;
            const interval = totalTime / steps;

            let step = 0;

            function animateStep() {
                if (step <= steps) {
                    const progress = step / steps;
                    robot.x = startX + (endX - startX) * progress;
                    robot.y = startY + (endY - startY) * progress;
                    robot.theta = interpolateAngle(startTheta, endTheta, progress);
                    renderRobot(robot);
                    step++;
                    setTimeout(animateStep, interval);
                } else {
                    commandIndex++;
                    if (commandIndex < commands.length) {
                        executeCommand(parseCommand(commands[commandIndex]));
                    }
                }
            }

            animateStep();
        }
    }

    function interpolateAngle(startTheta, endTheta, progress) {
        let delta = endTheta - startTheta;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        return startTheta + delta * progress;
    }

    executeCommand(parseCommand(commands[commandIndex]));
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