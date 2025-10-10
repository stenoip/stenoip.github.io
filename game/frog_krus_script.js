/*
IF YOU ARE EDITTING THIS CODE YOU ARE CHEATING!


Copyright 2025 Stenoip Company


Three.js
*/
const counterDOM = document.getElementById('counter');
      const endDOM = document.getElementById('end');
      const finalScoreDOM = document.getElementById('finalScore');
      const highScoreDOM = document.getElementById('highScore');
      const highScoreEndDOM = document.getElementById('highScoreEnd');

      let gameIsOver = false;

      // --- High Score Logic ---
      const loadHighScore = () => {
        const score = localStorage.getItem('crossyRoadHighScore') || 0;
        highScoreDOM.innerHTML = `High Score: ${score}`;
        return parseInt(score);
      };

      const saveHighScore = (score) => {
        const currentHighScore = loadHighScore();
        if (score > currentHighScore) {
          localStorage.setItem('crossyRoadHighScore', score);
          highScoreDOM.innerHTML = `High Score: ${score}`;
        }
      };

      loadHighScore(); // Load high score on startup

      const scene = new THREE.Scene();

      const distance = 500;
      const camera = new THREE.OrthographicCamera(
        window.innerWidth / -2,
        window.innerWidth / 2,
        window.innerHeight / 2,
        window.innerHeight / -2,
        0.1,
        10000
      );

      camera.rotation.x = 50 * Math.PI / 180;
      camera.rotation.y = 20 * Math.PI / 180;
      camera.rotation.z = 10 * Math.PI / 180;

      const initialCameraPositionY = -Math.tan(camera.rotation.x) * distance;
      const initialCameraPositionX = Math.tan(camera.rotation.y) * Math.sqrt(distance ** 2 + initialCameraPositionY ** 2);
      camera.position.y = initialCameraPositionY;
      camera.position.x = initialCameraPositionX;
      camera.position.z = distance;

      const zoom = 2;

      const frogSize = 15;
      const logSize = { w: 40, h: 20 }; // Log width and height in grid units

      const positionWidth = 42;
      const columns = 17;
      const boardWidth = positionWidth * columns;

      const stepTime = 200; // Miliseconds it takes for the frog to take a step

      let lanes;
      let currentLane;
      let currentColumn;

      let previousTimestamp;
      let startMoving;
      let moves;
      let stepStartTimestamp;

      const carFrontTexture = new Texture(40, 80, [{ x: 0, y: 10, w: 30, h: 60 }]);
      const carBackTexture = new Texture(40, 80, [{ x: 10, y: 10, w: 30, h: 60 }]);
      const carRightSideTexture = new Texture(110, 40, [
        { x: 10, y: 0, w: 50, h: 30 },
        { x: 70, y: 0, w: 30, h: 30 },
      ]);
      const carLeftSideTexture = new Texture(110, 40, [
        { x: 10, y: 10, w: 50, h: 30 },
        { x: 70, y: 10, w: 30, h: 30 },
      ]);

      const truckFrontTexture = new Texture(30, 30, [{ x: 15, y: 0, w: 10, h: 30 }]);
      const truckRightSideTexture = new Texture(25, 30, [{ x: 0, y: 15, w: 10, h: 10 }]);
      const truckLeftSideTexture = new Texture(25, 30, [{ x: 0, y: 5, w: 10, h: 10 }]);

      const generateLanes = () =>
        [-9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
          .map((index) => {
            const lane = new Lane(index);
            lane.mesh.position.y = index * positionWidth * zoom;
            scene.add(lane.mesh);
            return lane;
          })
          .filter((lane) => lane.index >= 0);

      const addLane = () => {
        const index = lanes.length;
        const lane = new Lane(index);
        lane.mesh.position.y = index * positionWidth * zoom;
        scene.add(lane.mesh);
        lanes.push(lane);
      };

      const frog = new Frog();
      scene.add(frog);

      const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
      scene.add(hemiLight);

      const initialDirLightPositionX = -100;
      const initialDirLightPositionY = -100;
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
      dirLight.position.set(initialDirLightPositionX, initialDirLightPositionY, 200);
      dirLight.castShadow = true;
      dirLight.target = frog;
      scene.add(dirLight);

      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      const d = 500;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;

      const backLight = new THREE.DirectionalLight(0x000000, 0.4);
      backLight.position.set(200, 200, 50);
      backLight.castShadow = true;
      scene.add(backLight);

      // ADDED 'river' TO LANE TYPES AND SPEEDS
      const laneTypes = ['car', 'truck', 'forest', 'river'];
      const laneSpeeds = [2, 2.5, 3, 1.5, 2.2];
      const vechicleColors = [0xa52523, 0xbdb638, 0x78b14b];
      const threeHeights = [20, 45, 60];

      const initaliseValues = () => {
        lanes.forEach((lane) => scene.remove(lane.mesh)); // Clean up old lanes
        lanes = generateLanes();

        currentLane = 0;
        currentColumn = Math.floor(columns / 2);

        previousTimestamp = null;

        startMoving = false;
        moves = [];
        stepStartTimestamp = null;
        gameIsOver = false;

        frog.position.x = 0;
        frog.position.y = 0;
        frog.position.z = 0;

        camera.position.y = initialCameraPositionY;
        camera.position.x = initialCameraPositionX;

        dirLight.position.x = initialDirLightPositionX;
        dirLight.position.y = initialDirLightPositionY;

        counterDOM.innerHTML = 0;
        loadHighScore();
      };

      // Initialise lanes here before renderer setup
      lanes = generateLanes();
      initaliseValues(); // Call once to set up initial state

      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);

      function Texture(width, height, rects) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        context.fillStyle = 'rgba(0,0,0,0.6)';
        rects.forEach((rect) => {
          context.fillRect(rect.x, rect.y, rect.w, rect.h);
        });
        return new THREE.CanvasTexture(canvas);
      }

      function Wheel() {
        const wheel = new THREE.Mesh(
          new THREE.BoxBufferGeometry(12 * zoom, 33 * zoom, 12 * zoom),
          new THREE.MeshLambertMaterial({ color: 0x333333, flatShading: true })
        );
        wheel.position.z = 6 * zoom;
        return wheel;
      }

      function Car() {
        const car = new THREE.Group();
        const color = vechicleColors[Math.floor(Math.random() * vechicleColors.length)];

        const main = new THREE.Mesh(
          new THREE.BoxBufferGeometry(60 * zoom, 30 * zoom, 15 * zoom),
          new THREE.MeshPhongMaterial({ color, flatShading: true })
        );
        main.position.z = 12 * zoom;
        main.castShadow = true;
        main.receiveShadow = true;
        car.add(main);

        const cabin = new THREE.Mesh(
          new THREE.BoxBufferGeometry(33 * zoom, 24 * zoom, 12 * zoom),
          [
            new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, map: carBackTexture }),
            new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, map: carFrontTexture }),
            new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, map: carRightSideTexture }),
            new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true, map: carLeftSideTexture }),
            new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true }), // top
            new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true }), // bottom
          ]
        );
        cabin.position.x = 6 * zoom;
        cabin.position.z = 25.5 * zoom;
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        car.add(cabin);

        const frontWheel = new Wheel();
        frontWheel.position.x = -18 * zoom;
        car.add(frontWheel);

        const backWheel = new Wheel();
        backWheel.position.x = 18 * zoom;
        car.add(backWheel);

        car.castShadow = true;
        car.receiveShadow = false;

        return car;
      }

      function Truck() {
        const truck = new THREE.Group();
        const color = vechicleColors[Math.floor(Math.random() * vechicleColors.length)];

        const base = new THREE.Mesh(
          new THREE.BoxBufferGeometry(100 * zoom, 25 * zoom, 5 * zoom),
          new THREE.MeshLambertMaterial({ color: 0xb4c6fc, flatShading: true })
        );
        base.position.z = 10 * zoom;
        truck.add(base);

        const cargo = new THREE.Mesh(
          new THREE.BoxBufferGeometry(75 * zoom, 35 * zoom, 40 * zoom),
          new THREE.MeshPhongMaterial({ color: 0xb4c6fc, flatShading: true })
        );
        cargo.position.x = 15 * zoom;
        cargo.position.z = 30 * zoom;
        cargo.castShadow = true;
        cargo.receiveShadow = true;
        truck.add(cargo);

        const cabin = new THREE.Mesh(
          new THREE.BoxBufferGeometry(25 * zoom, 30 * zoom, 30 * zoom),
          [
            new THREE.MeshPhongMaterial({ color, flatShading: true }), // back
            new THREE.MeshPhongMaterial({ color, flatShading: true, map: truckFrontTexture }),
            new THREE.MeshPhongMaterial({ color, flatShading: true, map: truckRightSideTexture }),
            new THREE.MeshPhongMaterial({ color, flatShading: true, map: truckLeftSideTexture }),
            new THREE.MeshPhongMaterial({ color, flatShading: true }), // top
            new THREE.MeshPhongMaterial({ color, flatShading: true }), // bottom
          ]
        );
        cabin.position.x = -40 * zoom;
        cabin.position.z = 20 * zoom;
        cabin.castShadow = true;
        cabin.receiveShadow = true;
        truck.add(cabin);

        const frontWheel = new Wheel();
        frontWheel.position.x = -38 * zoom;
        truck.add(frontWheel);

        const middleWheel = new Wheel();
        middleWheel.position.x = -10 * zoom;
        truck.add(middleWheel);

        const backWheel = new Wheel();
        backWheel.position.x = 30 * zoom;
        truck.add(backWheel);

        return truck;
      }

      function Three() {
        const three = new THREE.Group();

        const trunk = new THREE.Mesh(
          new THREE.BoxBufferGeometry(15 * zoom, 15 * zoom, 20 * zoom),
          new THREE.MeshPhongMaterial({ color: 0x4d2926, flatShading: true })
        );
        trunk.position.z = 10 * zoom;
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        three.add(trunk);

        const height = threeHeights[Math.floor(Math.random() * threeHeights.length)];

        const crown = new THREE.Mesh(
          new THREE.BoxBufferGeometry(30 * zoom, 30 * zoom, height * zoom),
          new THREE.MeshLambertMaterial({ color: 0x7aa21d, flatShading: true })
        );
        crown.position.z = (height / 2 + 20) * zoom;
        crown.castShadow = true;
        crown.receiveShadow = false;
        three.add(crown);

        return three;
      }

      // --- RIVER & LOG FUNCTIONS ---
      function River() {
        const river = new THREE.Group();
        const createSection = (color) =>
          new THREE.Mesh(
            new THREE.BoxBufferGeometry(boardWidth * zoom, positionWidth * zoom, 3 * zoom),
            new THREE.MeshPhongMaterial({ color })
          );

        // Water is blue
        const middle = createSection(0x00bfff); // Light blue for water
        middle.receiveShadow = true;
        river.add(middle);

        const left = createSection(0x00aae0); // Slightly darker for side bands
        left.position.x = -boardWidth * zoom;
        river.add(left);

        const right = createSection(0x00aae0);
        right.position.x = boardWidth * zoom;
        river.add(right);

        river.position.z = 1.5 * zoom; // Same z as grass
        return river;
      }

      function Log() {
        const log = new THREE.Mesh(
          new THREE.BoxBufferGeometry(logSize.w * zoom, logSize.h * zoom, 10 * zoom),
          new THREE.MeshLambertMaterial({ color: 0x8B5A2B, flatShading: true }) // Brown color
        );
        log.position.z = 5 * zoom; // Sits on top of the water plane
        log.castShadow = true;
        log.receiveShadow = true;
        log.userData.isLog = true; // Tag for hit testing

        return log;
      }
      // --- END NEW FUNCTIONS ---

      function Frog() {
        const frog = new THREE.Group();
        const frogColor = 0x4caf50;

        const body = new THREE.Mesh(
          new THREE.BoxBufferGeometry(frogSize * zoom, frogSize * zoom, 10 * zoom),
          new THREE.MeshPhongMaterial({ color: frogColor, flatShading: true })
        );
        body.position.z = 5 * zoom;
        body.castShadow = true;
        body.receiveShadow = true;
        frog.add(body);

        const eye = new THREE.Mesh(
          new THREE.BoxBufferGeometry(3 * zoom, 3 * zoom, 5 * zoom),
          new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true })
        );
        eye.position.z = 12 * zoom;
        eye.position.x = (frogSize / 4) * zoom;
        eye.position.y = (frogSize / 4) * zoom;
        eye.castShadow = true;
        eye.receiveShadow = false;

        const eye2 = eye.clone();
        eye2.position.x = -(frogSize / 4) * zoom;
        eye2.position.y = (frogSize / 4) * zoom;

        frog.add(eye);
        frog.add(eye2);

        return frog;
      }

      function Road() {
        const road = new THREE.Group();

        const createSection = (color) =>
          new THREE.Mesh(
            new THREE.PlaneBufferGeometry(boardWidth * zoom, positionWidth * zoom),
            new THREE.MeshPhongMaterial({ color })
          );

        const middle = createSection(0x454a59);
        middle.receiveShadow = true;
        road.add(middle);

        const left = createSection(0x393d49);
        left.position.x = -boardWidth * zoom;
        road.add(left);

        const right = createSection(0x393d49);
        right.position.x = boardWidth * zoom;
        road.add(right);

        return road;
      }

      function Grass() {
        const grass = new THREE.Group();

        const createSection = (color) =>
          new THREE.Mesh(
            new THREE.BoxBufferGeometry(boardWidth * zoom, positionWidth * zoom, 3 * zoom),
            new THREE.MeshPhongMaterial({ color })
          );

        const middle = createSection(0xbaf455);
        middle.receiveShadow = true;
        grass.add(middle);

        const left = createSection(0x99c846);
        left.position.x = -boardWidth * zoom;
        grass.add(left);

        const right = createSection(0x99c846);
        right.position.x = boardWidth * zoom;
        grass.add(right);

        grass.position.z = 1.5 * zoom;
        return grass;
      }

      function Lane(index) {
        this.index = index;
        this.type = index <= 0 ? 'field' : laneTypes[Math.floor(Math.random() * laneTypes.length)];

        switch (this.type) {
          case 'field': {
            this.type = 'field';
            this.mesh = new Grass();
            break;
          }
          case 'forest': {
            this.mesh = new Grass();

            this.occupiedPositions = new Set();
            this.threes = [1, 2, 3, 4].map(() => {
              const three = new Three();
              let position;
              do {
                position = Math.floor(Math.random() * columns);
              } while (this.occupiedPositions.has(position));
              this.occupiedPositions.add(position);
              three.position.x = (position * positionWidth + positionWidth / 2) * zoom - boardWidth * zoom / 2;
              this.mesh.add(three);
              return three;
            });
            break;
          }
          case 'car':
          case 'truck': {
            this.mesh = new Road();
            this.direction = Math.random() >= 0.5;

            const occupiedPositions = new Set();
            const VechicleConstructor = this.type === 'car' ? Car : Truck;
            const VechicleLengthMultiplier = this.type === 'car' ? 2 : 3;
            const vechicleCount = this.type === 'car' ? 3 : 2;

            this.vechicles = Array.from({ length: vechicleCount }).map(() => {
              const vechicle = new VechicleConstructor();
              let position;
              do {
                position = Math.floor(Math.random() * columns / VechicleLengthMultiplier);
              } while (occupiedPositions.has(position));
              occupiedPositions.add(position);
              vechicle.position.x = (position * positionWidth * VechicleLengthMultiplier + positionWidth / 2) * zoom - boardWidth * zoom / 2;
              if (!this.direction) vechicle.rotation.z = Math.PI;
              this.mesh.add(vechicle);
              return vechicle;
            });

            this.speed = laneSpeeds[Math.floor(Math.random() * 3)]; // Use first 3 for cars/trucks
            break;
          }
          // RIVER LOGIC
          case 'river': {
            this.mesh = new River();
            this.direction = Math.random() >= 0.5;

            const logCount = 4;
            this.obstacles = Array.from({ length: logCount }).map((_, i) => {
              const log = new Log();
              // Initial position is evenly spaced off-screen for a continuous look
              const spacing = boardWidth * zoom * 1.5 / logCount;
              const initialOffset = -boardWidth * zoom / 2;
              log.position.x = initialOffset + i * spacing;

              this.mesh.add(log);
              return log;
            });

            // Use the last two speeds for logs/rivers
            this.speed = laneSpeeds[3 + Math.floor(Math.random() * 2)];
            break;
          }
        }
      }

      const endGame = () => {
        if (gameIsOver) return;
        gameIsOver = true;
        saveHighScore(currentLane);
        finalScoreDOM.innerHTML = currentLane;
        highScoreEndDOM.innerHTML = loadHighScore();
        endDOM.style.visibility = 'visible';
      };

      document.querySelector('#retry').addEventListener('click', () => {
        lanes.forEach((lane) => scene.remove(lane.mesh));
        initaliseValues();
        endDOM.style.visibility = 'hidden';
      });

      // --- MOBILE CONTROLS RESTORED ---
      document.getElementById('forward').addEventListener('click', () => move('forward'));
      document.getElementById('backward').addEventListener('click', () => move('backward'));
      document.getElementById('left').addEventListener('click', () => move('left'));
      document.getElementById('right').addEventListener('click', () => move('right'));

      window.addEventListener('keydown', (event) => {
        if (event.keyCode == '38') move('forward');
        else if (event.keyCode == '40') move('backward');
      	else if (event.keyCode == '37') move('left');
        else if (event.keyCode == '39') move('right');
      });

      function move(direction) {
        if (gameIsOver) return;
        if (moves.length > 0) return;

        const finalPositions = moves.reduce(
          (position, move) => {
            if (move === 'forward') return { lane: position.lane + 1, column: position.column };
            if (move === 'backward') return { lane: position.lane - 1, column: position.column };
            if (move === 'left') return { lane: position.lane, column: position.column - 1 };
            if (move === 'right') return { lane: position.lane, column: position.column + 1 };
          },
          { lane: currentLane, column: currentColumn }
        );

        let nextLaneIndex;
        let nextColumn;

        if (direction === 'forward') {
          nextLaneIndex = finalPositions.lane + 1;
          nextColumn = finalPositions.column;
        } else if (direction === 'backward') {
          if (finalPositions.lane === 0) return;
          nextLaneIndex = finalPositions.lane - 1;
          nextColumn = finalPositions.column;
        } else if (direction === 'left') {
          if (finalPositions.column === 0) return;
          nextLaneIndex = finalPositions.lane;
          nextColumn = finalPositions.column - 1;
        } else if (direction === 'right') {
          if (finalPositions.column === columns - 1) return;
          nextLaneIndex = finalPositions.lane;
          nextColumn = finalPositions.column + 1;
        }
        
        const nextLane = lanes[nextLaneIndex];

        // Check for collision with trees (still apply to river lanes for consistency)
        if (nextLane && nextLane.type === 'forest' && nextLane.occupiedPositions.has(nextColumn)) {
        	return;
        }

        if (direction === 'forward') {
        	addLane();
        }

        if (!stepStartTimestamp) startMoving = true;
        moves.push(direction);
      }

      function animate(timestamp) {
        requestAnimationFrame(animate);

        if (!previousTimestamp) previousTimestamp = timestamp;
        const delta = timestamp - previousTimestamp;
        previousTimestamp = timestamp;

        if (!gameIsOver) {
          
          // ANIAMTE MOVEMENT (Cars, Trucks, and Logs)
          lanes.forEach((lane) => {
            // Check if the lane has moving objects (vechicles or logs)
            const movingObjects = lane.vechicles || lane.obstacles;

            if (movingObjects) {
              const aBitBeforeTheBeginingOfLane = -boardWidth * zoom * 2;
              const aBitAfterTheEndOFLane = boardWidth * zoom * 2;

              movingObjects.forEach((object) => {
                if (lane.direction) {
                  object.position.x =
                    object.position.x < aBitBeforeTheBeginingOfLane
                      ? aBitAfterTheEndOFLane
                      : (object.position.x -= (lane.speed / 16) * delta);
                } else {
                  object.position.x =
                    object.position.x > aBitAfterTheEndOFLane
                      ? aBitBeforeTheBeginingOfLane
                      : (object.position.x += (lane.speed / 16) * delta);
                }
              });
            }
          });
        }

        if (startMoving) {
          stepStartTimestamp = timestamp;
          startMoving = false;
        }

        if (stepStartTimestamp && !gameIsOver) {
          // Step movement logic
          const moveDeltaTime = timestamp - stepStartTimestamp;
          const moveDeltaDistance = Math.min(moveDeltaTime / stepTime, 1) * positionWidth * zoom;
          const jumpDeltaDistance = Math.sin(Math.min(moveDeltaTime / stepTime, 1) * Math.PI) * 8 * zoom;

          switch (moves[0]) {
            case 'forward': {
              const positionY = currentLane * positionWidth * zoom + moveDeltaDistance;
              camera.position.y = initialCameraPositionY + positionY;
              dirLight.position.y = initialDirLightPositionY + positionY;
              frog.position.y = positionY;
              frog.position.z = jumpDeltaDistance;
              break;
            }
            case 'backward': {
              const positionY = currentLane * positionWidth * zoom - moveDeltaDistance;
              camera.position.y = initialCameraPositionY + positionY;
              dirLight.position.y = initialDirLightPositionY + positionY;
              frog.position.y = positionY;
              frog.position.z = jumpDeltaDistance;
              break;
            }
            case 'left': {
              const positionX =
                (currentColumn * positionWidth + positionWidth / 2) * zoom - boardWidth * zoom / 2 - moveDeltaDistance;
              camera.position.x = initialCameraPositionX + positionX;
              dirLight.position.x = initialDirLightPositionX + positionX;
              frog.position.x = positionX;
              frog.position.z = jumpDeltaDistance;
              break;
            }
            case 'right': {
              const positionX =
                (currentColumn * positionWidth + positionWidth / 2) * zoom - boardWidth * zoom / 2 + moveDeltaDistance;
              camera.position.x = initialCameraPositionX + positionX;
              dirLight.position.x = initialDirLightPositionX + positionX;
              frog.position.x = positionX;
              frog.position.z = jumpDeltaDistance;
              break;
            }
          }
          // Once a step has ended
          if (moveDeltaTime > stepTime) {
            switch (moves[0]) {
              case 'forward': {
                currentLane++;
                counterDOM.innerHTML = currentLane;
                break;
              }
              case 'backward': {
                currentLane--;
                counterDOM.innerHTML = currentLane;
                break;
              }
              case 'left': {
                currentColumn--;
                break;
              }
              case 'right': {
                currentColumn++;
                break;
              }
            }
            moves.shift();
            stepStartTimestamp = moves.length === 0 ? null : timestamp;
          }
        }

        // --- HIT TEST LOGIC ---
        if (!gameIsOver) {
          const currentLaneObject = lanes[currentLane];
          
          const frogMinX = frog.position.x - frogSize * zoom / 2;
          const frogMaxX = frog.position.x + frogSize * zoom / 2;

          if (currentLaneObject.type === 'car' || currentLaneObject.type === 'truck') {
            const vechicleLength = { car: 60, truck: 105 }[currentLaneObject.type];
            currentLaneObject.vechicles.forEach((vechicle) => {
              const carMinX = vechicle.position.x - vechicleLength * zoom / 2;
              const carMaxX = vechicle.position.x + vechicleLength * zoom / 2;
              if (frogMaxX > carMinX && frogMinX < carMaxX) {
                endGame();
              }
            });
          } else if (currentLaneObject.type === 'river') {
            let onLog = false;
            const logLength = logSize.w * zoom;
            currentLaneObject.obstacles.forEach((log) => {
              // Check for rough overlap on the log
              const logMinX = log.position.x - logLength / 2;
              const logMaxX = log.position.x + logLength / 2;

              // Collision check: The frog's bounding box intersects the log's bounding box
              if (frogMaxX > logMinX && frogMinX < logMaxX) {
                onLog = true;
                // Frog rides the log, move its x position
                const logSpeedDelta = (currentLaneObject.speed / 16) * delta;
                frog.position.x += currentLaneObject.direction ? -logSpeedDelta : logSpeedDelta;
              }
            });

            // If currently in the river lane and not on a log, game over (drown)
            // We only check this when the frog is not mid-jump (moves.length === 0)
            if (!onLog && moves.length === 0) {
              endGame();
            }
            
            // Check if frog rode off the edge of the board while on a log
            const boardMinX = -boardWidth * zoom / 2;
            const boardMaxX = boardWidth * zoom / 2;
            if (onLog && (frog.position.x < boardMinX - 10 * zoom || frog.position.x > boardMaxX + 10 * zoom)) {
            	endGame();
            }
          }
        }

        renderer.render(scene, camera);
      }

      requestAnimationFrame(animate);
