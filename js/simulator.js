document.getElementById('startSimBtn').onclick = function() {
    const code = document.getElementById('codeArea').value;
    stopSimulationFlag = false; // Reset the stop flag when starting a new simulation
    startSimulation(code);
};

document.getElementById('stopSimBtn').onclick = function() {
    stopSimulationFlag = true;
};

let stopSimulationFlag = false;

function startSimulation(code) {
    const commands = code.split('\n').filter(cmd => cmd.trim().length > 0);
    let commandIndex = 0;

    const robot = {
        x: 0,
        y: 0,
        theta: 90, // Start facing the top of the screen (90 degrees in the new system)
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
                const reverse = command.includes('gfr::Flags::REVERSE');
                return { type: 'move', x, y, theta, speed, reverse };
            }
        }
        return null;
    }

    function executeCommand(command) {
        if (!command || stopSimulationFlag) return;
        
        if (command.type === 'set_pose') {
            robot.x = command.x;
            robot.y = command.y;
            robot.theta = adjustAngle(command.theta);
            renderRobot(robot);
            commandIndex++;
            if (commandIndex < commands.length && !stopSimulationFlag) {
                setTimeout(() => executeCommand(parseCommand(commands[commandIndex])), 500);
            }
        } else if (command.type === 'move') {
            const startX = robot.x;
            const startY = robot.y;
            const startTheta = robot.theta;
            const endX = command.x;
            const endY = command.y;
            let endTheta = adjustAngle(command.theta);
            const reverse = command.reverse;
            
            if (reverse) {
                endTheta = adjustAngle(command.theta + 180); // Adjust theta for reverse mode
            }

            const steps = (21 - Number(document.getElementById('SimSpeed').value)) * Number(document.getElementById('multiplierSlider').value); 
            let step = 0;

            function animateStep() {
                if (step <= steps && !stopSimulationFlag) {
                    const progress = step / steps;
                    robot.x = startX + (endX - startX) * progress;
                    robot.y = startY + (endY - startY) * progress;
                    robot.theta = interpolateAngle(startTheta, endTheta, progress);
                    renderRobot(robot, reverse); // Pass reverse flag to renderRobot
                    step++;
                    requestAnimationFrame(animateStep);
                } else if (!stopSimulationFlag) {
                    robot.theta = endTheta; 
                    renderRobot(robot, reverse); 
                    commandIndex++;
                    if (commandIndex < commands.length) {
                        executeCommand(parseCommand(commands[commandIndex]));
                    }
                }
            }

            animateStep();
        }
    }

    function adjustAngle(theta) {
        // Adjust the angle to the new coordinate system
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

    executeCommand(parseCommand(commands[commandIndex]));
}

function renderRobot(robot, reverse = false) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    render();
    ctx.save();
    ctx.translate(robot.x * imgPixelsPerInch + imgHalfActualWidth, imgActualWidth - robot.y * imgPixelsPerInch - imgHalfActualWidth);
    ctx.rotate((robot.theta * Math.PI) / 180);
    ctx.fillStyle = 'black';
    if (reverse) {
        ctx.fillRect(-robot.width / 2, -robot.height / 2, robot.width, robot.height);
        ctx.fillStyle = 'red';
        ctx.fillRect(-robot.width / 2, robot.height / 2 - 5, robot.width, 5); 
    } else {
        ctx.fillRect(-robot.width / 2, -robot.height / 2, robot.width, robot.height); 
        ctx.fillStyle = 'red';
        ctx.fillRect(-robot.width / 2, -robot.height / 2, robot.width, 5); 
    }
    ctx.restore();
}
