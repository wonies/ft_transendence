import Component from "../core/Component.js";

export default class AiGame extends Component {
  constructor(props) {
    super(props);
    this.gameWidth = window.innerWidth;
    this.gameHeight = window.innerHeight;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.engine = null;
    this.world = null;
    this.ball = null;
    this.paddle_one = null;
    this.paddle_two = null;
    this.ballMesh = null;
    this.paddle_One_Mesh = null;
    this.paddle_Two_Mesh = null;
    this.scoreElement = null;
    this.playerOnePoint = 0;
    this.playerTwoPoint = 0;
    this.isGameOver = false;
    this.AiOpponent = true;
    this.aiTargetY = 0;
    this.lastBallPosition = { x: 0, y: 0 };
    this.lastUpdateTime = Date.now();
    this.initialSpeed = this.gameWidth * 0.004;
    this.topWall = null;
    this.bottomWall = null;
    this.wallMeshTop = null;
    this.wallMeshBottom = null;
    this.init();
    console.log("-----------constructor-----------");
    this.setup();
    this.language = sessionStorage.getItem("language");
  }

  setup() {
    this.setState({
      image: "../../main/public/pongmatch.png",
      scoreLeft: 0,
      scoreRight: 0,
      playerLeft: "Human",
      playerRight: "Ai",
    });
  }

  init() {
    this.setupScene();
    this.setupPhysics();
    this.createWalls();
    this.createBall();
    this.createPaddles();
    this.createThreeJsObjects();
    this.createScoreDisplay();
    this.setupEventListeners();
    this.animate();
    this.loadBackground();
  }

  template() {
    const language = this.language;
    const { scoreLeft, scoreRight, image, playerLeft, playerRight } =
      this.$state;
    return `
     <div class="game-canvas">
      <div class="game-ui">
        <div class="score-display">${scoreLeft} : ${scoreRight}</div>
        <div class="playerLeft-display">${this.getPlayerName(
          language,
          "left",
          playerLeft
        )}</div>
        <div class="playerRight-display">${this.getPlayerName(
          language,
          "right",
          playerRight
        )}</div>
      </div>
    </div>
    <div id="myModal" class="modal">
      <div class="modal-content">
        <h2 id="modalText"></h2>
        <div class="modal-buttons">
          <button id="restartButton">${this.getButtonText(
            language,
            "restart"
          )}</button>
          <button id="homeButton">${this.getButtonText(
            language,
            "home"
          )}</button>
        </div>
      </div>
    </div>
        `;
  }

  getPlayerName(lang, side, name) {
    const texts = {
      en: { left: "Human", right: "AI" },
      ko: { left: "사람", right: "인공지능" },
      ja: { left: "人間", right: "AI" },
    };
    return name || texts[lang]?.[side] || texts.en[side];
  }

  getButtonText(lang, type) {
    const texts = {
      en: { restart: "Restart", home: "Go to Home" },
      ko: { restart: "다시하기", home: "홈으로 가기" },
      ja: { restart: "リスタート", home: "ホームへ" },
    };
    return texts[lang]?.[type] || texts.en[type];
  }

  getWinnerText(lang, winner) {
    const texts = {
      en: { human: "Human WIN!", ai: "AI WIN!" },
      ko: { human: "사람 승리!", ai: "인공지능 승리!" },
      ja: { human: "人間の勝利!", ai: "AIの勝利!" },
    };
    return texts[lang]?.[winner] || texts.en[winner];
  }

  loadBackground() {
    const loader = new THREE.TextureLoader();
    loader.load("/static/main/public/tables.png", (texture) => {
      this.backgroundTexture = texture;
      this.backgroundTexture.encoding = THREE.sRGBEncoding;
      this.scene.background = this.backgroundTexture;
    });
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x4558f0);

    this.camera = new THREE.OrthographicCamera(
      -this.gameWidth / 2,
      this.gameWidth / 2,
      this.gameHeight / 2,
      -this.gameHeight / 2,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(this.gameWidth, this.gameHeight);
    document.body.appendChild(this.renderer.domElement);
  }

  setupPhysics() {
    const { Engine, World, Resolver } = Matter;

    this.engine = Engine.create({
      gravity: { x: 0, y: 0, scale: 0 },
    });

    Resolver._restingThresh = 0.001;

    this.world = this.engine.world;
  }

  createWalls() {
    const { Bodies, World } = Matter;
    const wallThickness = 10;

    const createWall = (x, y, width, height) => {
      return Bodies.rectangle(x, y, width, height, {
        isStatic: true,
        restitution: 1,
        friction: 0,
        density: 1,
        slop: 0,
        render: { visible: false },
      });
    };

    this.topWall = createWall(
      0,
      -this.gameHeight / 2,
      this.gameWidth,
      wallThickness
    );
    this.bottomWall = createWall(
      0,
      this.gameHeight / 2,
      this.gameWidth,
      wallThickness
    );

    World.add(this.world, [this.topWall, this.bottomWall]);
  }

  createBall() {
    const { Bodies, World, Body } = Matter;
    const ballRadius = this.gameWidth * 0.01;
    this.ball = Bodies.circle(0, 0, ballRadius, {
      label: "ball",
      restitution: 1,
      friction: 0,
      frictionAir: 0,
      density: 1,
      slop: 0,
    });
    World.add(this.world, this.ball);

    const angle = Math.random() * Math.PI * 2;
    Body.setVelocity(this.ball, {
      x: Math.cos(angle) * this.initialSpeed,
      y: Math.sin(angle) * this.initialSpeed,
    });
  }

  createPaddles() {
    const { Bodies, World } = Matter;
    const paddleWidth = this.gameWidth * 0.02;
    const paddleHeight = this.gameHeight * 0.15;
    const paddleOffsetX = this.gameWidth * 0.45;

    this.paddle_one = Bodies.rectangle(
      -paddleOffsetX,
      0,
      paddleWidth,
      paddleHeight,
      {
        label: "paddle_one",
        isStatic: true,
        friction: 0,
        frictionAir: 0,
        density: 1,
        slop: 0,
      }
    );

    this.paddle_two = Bodies.rectangle(
      paddleOffsetX,
      0,
      paddleWidth,
      paddleHeight,
      {
        label: "paddle_two",
        isStatic: true,
        friction: 0,
        frictionAir: 0,
        density: 1,
        slop: 0,
      }
    );

    World.add(this.world, [this.paddle_one, this.paddle_two]);
  }

  createThreeJsObjects() {
    // Create walls
    const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const wallGeometryTop = new THREE.BoxGeometry(this.gameWidth, 10, 0);
    const wallGeometryBottom = new THREE.BoxGeometry(this.gameWidth, 10, 0);
    this.wallMeshTop = new THREE.Mesh(wallGeometryTop, wallMaterial);
    this.wallMeshBottom = new THREE.Mesh(wallGeometryBottom, wallMaterial);
    this.wallMeshTop.position.set(0, -this.gameHeight / 2, 0);
    this.wallMeshBottom.position.set(0, this.gameHeight / 2, 0);
    this.scene.add(this.wallMeshTop, this.wallMeshBottom);

    // Create ball
    const ballGeometry = new THREE.CircleGeometry(this.gameWidth * 0.01, 32);
    const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
    this.scene.add(this.ballMesh);

    // Create paddles
    const paddleGeometry = new THREE.BoxGeometry(
      this.gameWidth * 0.02,
      this.gameHeight * 0.15,
      0.1
    );
    const paddleMaterial = new THREE.MeshBasicMaterial({ color: 0xcd4b57 });
    this.paddle_One_Mesh = new THREE.Mesh(paddleGeometry, paddleMaterial);
    this.paddle_Two_Mesh = new THREE.Mesh(paddleGeometry, paddleMaterial);
    this.scene.add(this.paddle_One_Mesh, this.paddle_Two_Mesh);
  }

  createScoreDisplay() {
    this.scoreElement = document.createElement("div");
    this.scoreElement.style.position = "absolute";
    this.scoreElement.style.top = "20px";
    this.scoreElement.style.left = "50%";
    this.scoreElement.style.transform = "translateX(-50%)";
    this.scoreElement.style.color = "white";
    this.scoreElement.style.fontFamily = "Arial, sans-serif";
    document.body.appendChild(this.scoreElement);
  }

  setupEventListeners() {
    document.addEventListener("keydown", this.handleKeyPress.bind(this));
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  handleKeyPress(event) {
    const { Body } = Matter;
    const moveSpeed = this.gameHeight * 0.02;
    const halfPaddleHeight = (this.gameHeight * 0.15) / 2;
    const maxY = this.gameHeight / 2 - halfPaddleHeight;
    const minY = -this.gameHeight / 2 + halfPaddleHeight;

    if (
      (event.key == "w" || event.key == "W") &&
      this.paddle_one &&
      this.paddle_one.position
    ) {
      const newY = Math.min(this.paddle_one.position.y + moveSpeed, maxY);
      Body.setPosition(this.paddle_one, {
        x: this.paddle_one.position.x,
        y: newY,
      });
    } else if (
      (event.key == "s" || event.key == "S") &&
      this.paddle_one &&
      this.paddle_one.position
    ) {
      const newY = Math.max(this.paddle_one.position.y - moveSpeed, minY);
      Body.setPosition(this.paddle_one, {
        x: this.paddle_one.position.x,
        y: newY,
      });
    }
  }

  handleResize() {
    const { Body } = Matter;
    this.gameWidth = window.innerWidth;
    this.gameHeight = window.innerHeight;

    this.camera.left = -this.gameWidth / 2;
    this.camera.right = this.gameWidth / 2;
    this.camera.top = this.gameHeight / 2;
    this.camera.bottom = -this.gameHeight / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.gameWidth, this.gameHeight);

    // Update paddle positions
    const newPaddleOffsetX = this.gameWidth * 0.4;
    Body.setPosition(this.paddle_one, {
      x: -newPaddleOffsetX,
      y: this.paddle_one.position.y,
    });
    Body.setPosition(this.paddle_two, {
      x: newPaddleOffsetX,
      y: this.paddle_two.position.y,
    });

    // Update wall positions and sizes
    Body.setPosition(this.topWall, { x: 0, y: -this.gameHeight / 2 });
    Body.setPosition(this.bottomWall, { x: 0, y: this.gameHeight / 2 });
    Body.scale(this.topWall, this.gameWidth / this.topWall.bounds.max.x, 1);
    Body.scale(
      this.bottomWall,
      this.gameWidth / this.bottomWall.bounds.max.x,
      1
    );

    // Update Three.js wall meshes
    this.wallMeshTop.scale.set(
      this.gameWidth / this.wallMeshTop.geometry.parameters.width,
      1,
      1
    );
    this.wallMeshBottom.scale.set(
      this.gameWidth / this.wallMeshBottom.geometry.parameters.width,
      1,
      1
    );
    this.wallMeshTop.position.set(0, -this.gameHeight / 2, 0);
    this.wallMeshBottom.position.set(0, this.gameHeight / 2, 0);
  }

  resetBall() {
    const { Body } = Matter;
    Body.setPosition(this.ball, { x: 0, y: 0 });
    const angle = Math.random() * Math.PI * 2;
    Body.setVelocity(this.ball, {
      x: Math.cos(angle) * this.initialSpeed,
      y: Math.sin(angle) * this.initialSpeed,
    });
  }

  updateScore() {
    if (this.ball.position.x > this.gameWidth / 2) {
      this.setState({ scoreLeft: this.$state.scoreLeft + 1 });
      this.resetBall();
    } else if (this.ball.position.x < -this.gameWidth / 2) {
      this.setState({ scoreRight: this.$state.scoreRight + 1 });
      this.resetBall();
    }
  }

  updateScoreDisplay() {
    const scoreDisplay = this.$target.querySelector(".score-display");
    if (scoreDisplay) {
      scoreDisplay.textContent = `${this.$state.scoreLeft} : ${this.$state.scoreRight}`;
    }
  }

  endGame() {
    if (this.isGameOver) return;

    var modal = document.getElementById("myModal");
    if (!modal) {
      console.error("Modal element not found");
      return;
    }

    var modalText = document.getElementById("modalText");
    if (!modalText) {
      console.error("Modal text element not found");
      return;
    }

    // var closeModalBtn = modal.querySelector('.close');
    var restartButton = document.getElementById("restartButton");
    var homeButton = document.getElementById("homeButton");

    if (this.$state.scoreLeft >= 3) {
      modal.style.display = "block";
      modalText.textContent = this.getWinnerText(this.language, "human");
      this.isGameOver = true;
    } else if (this.$state.scoreRight >= 3) {
      modal.style.display = "block";
      modalText.textContent = this.getWinnerText(this.language, "ai");
      this.isGameOver = true;
    }

    // if (closeModalBtn) {
    //   closeModalBtn.onclick = () => {
    //     modal.style.display = 'none';
    //   };
    // } else {
    //   console.warn('Close button not found in modal');
    // }

    window.onclick = (event) => {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };

    if (restartButton) {
      restartButton.onclick = () => {
        modal.style.display = "none";
        this.navigateToNewGame();
      };
    } else {
      console.warn("Restart button not found");
    }

    if (homeButton) {
      homeButton.onclick = () => {
        modal.style.display = "none";
        this.navigateToHome();
      };
    } else {
      console.warn("Home button not found");
    }
  }

  resetGame() {
    this.setState({
      scoreLeft: 0,
      scoreRight: 0,
      playerLeft: "Human",
      playerRight: "Ai",
    });
    this.isGameOver = false;
  }

  navigateToNewGame() {
    console.log("Navigating to new game");
    this.cleanup();
    this.resetGame();
    this.init();

    const modal = document.getElementById("myModal");
    if (modal) {
      modal.style.display = "none";
    }
  }

  navigateToHome() {
    console.log("Navigating to home");
    this.cleanup();
    window.location.hash = "#ingame-1";
  }

  updateAiTarget() {
    const currentTime = Date.now();
    if (currentTime - this.lastUpdateTime >= 1000) {
      this.aiTargetY = this.lastBallPosition.y;
      this.lastBallPosition = {
        x: this.ball.position.x,
        y: this.ball.position.y,
      };
      this.lastUpdateTime = currentTime;
    }
  }

  moveAiPaddle() {
    if (!this.AiOpponent) return;

    const { Body } = Matter;
    const moveSpeed = this.gameHeight * 0.002;
    const paddleY = this.paddle_two.position.y;
    const direction = this.aiTargetY > paddleY ? 1 : -1;
    const newY = paddleY + direction * moveSpeed;

    const halfPaddleHeight = (this.gameHeight * 0.15) / 2;
    const maxY = this.gameHeight / 2 - halfPaddleHeight;
    const minY = -this.gameHeight / 2 + halfPaddleHeight;
    const clampedY = Math.max(minY, Math.min(maxY, newY));

    Body.setPosition(this.paddle_two, {
      x: this.paddle_two.position.x,
      y: clampedY,
    });
  }

  setEvent() {
    this.addEventListeners();
  }

  addEventListeners() {
    document.addEventListener("keydown", this.handleKeyPress.bind(this));
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  animate() {
    if (this.isGameOver) {
      return;
    }

    Matter.Engine.update(this.engine, 1000 / 60);

    this.ballMesh.position.set(this.ball.position.x, this.ball.position.y, 0);
    this.paddle_One_Mesh.position.set(
      this.paddle_one.position.x,
      this.paddle_one.position.y,
      0
    );
    this.paddle_Two_Mesh.position.set(
      this.paddle_two.position.x,
      this.paddle_two.position.y,
      0
    );

    this.updateAiTarget();
    this.moveAiPaddle();

    const velocity = this.ball.velocity;
    const currentSpeed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
    if (Math.abs(currentSpeed - this.initialSpeed) > 0.0001) {
      Matter.Body.setVelocity(this.ball, {
        x: (velocity.x / currentSpeed) * this.initialSpeed,
        y: (velocity.y / currentSpeed) * this.initialSpeed,
      });
    }

    this.updateScore();
    this.endGame();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate.bind(this));
  }

  disposeSceneObjects(scene) {
    scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  }

  cleanup() {
    console.log("-----------cleanup-----------");

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer.domElement.remove();
      this.renderer = null;
    }

    if (this.scene) {
      this.disposeSceneObjects(this.scene);
      this.scene = null;
    }

    if (this.world) {
      Matter.World.clear(this.world);
      this.world = null;
    }

    if (this.engine) {
      Matter.Engine.clear(this.engine);
      this.engine = null;
    }

    document.removeEventListener("keydown", this.handleKeyPress);
    window.removeEventListener("resize", this.handleResize);

    if (this.$target) {
      this.$target.innerHTML = "";
    }

    if (this.scoreElement && this.scoreElement.parentNode) {
      this.scoreElement.parentNode.removeChild(this.scoreElement);
    }

    this.isGameOver = true;
    this.ball = null;
    this.paddle_one = null;
    this.paddle_two = null;
    this.ballMesh = null;
    this.paddle_One_Mesh = null;
    this.paddle_Two_Mesh = null;

    super.cleanup();
  }

  unmounted() {
    console.log("-----------unmount-----------");
    this.cleanup();
    super.unmounted();
  }
}
