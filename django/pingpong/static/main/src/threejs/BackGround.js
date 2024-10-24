import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export class BackGround {
  constructor(container) {
    this.container = container;
    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);

    this.camera.position.set(0, 0, 40);
    this.camera.lookAt(0, 0, 0);

    const light = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(light);

    //추가
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(10, 10, 10);

    //orbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.loadBackground();
    this.loadModel();

    this.animate();
    window.addEventListener("resize", this.onWindowResize.bind(this));
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // 배경 텍스처 크기 조정
    if (this.backgroundTexture) {
      this.adjustBackgroundSize();
    }

    // 탁구채 크기 조정
    if (this.racket) {
      const scaleFactor = Math.min(window.innerWidth, window.innerHeight) / 300;
      this.racket.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }
  }

  loadBackground() {
    const loader = new THREE.TextureLoader();
    loader.load("/static/main/public/pongtable.jpg", (texture) => {
      this.backgroundTexture = texture;
      this.backgroundTexture.encoding = THREE.sRGBEncoding;
      this.scene.background = this.backgroundTexture;
      this.adjustBackgroundSize();
    });
  }

  adjustBackgroundSize() {
    const aspectRatio = window.innerWidth / window.innerHeight;
    const textureAspect =
      this.backgroundTexture.image.width / this.backgroundTexture.image.height;

    if (aspectRatio < textureAspect) {
      this.backgroundTexture.repeat.set(1, textureAspect / aspectRatio);
      this.backgroundTexture.offset.set(
        0,
        (1 - textureAspect / aspectRatio) / 2
      );
    } else {
      this.backgroundTexture.repeat.set(aspectRatio / textureAspect, 1);
      this.backgroundTexture.offset.set(
        (1 - aspectRatio / textureAspect) / 2,
        0
      );
    }
  }

  loadModel() {
    const loader = new GLTFLoader();
    loader.load("/static/main/public/scene.gltf", (gltf) => {
      this.racket = gltf.scene;
      this.racket.position.set(0, 0, 5);
      this.racket.rotation.x = Math.PI;
      this.racket.rotation.y = Math.PI / 4;
      this.racket.rotation.z = Math.PI;

      this.scene.add(this.racket);
      this.onWindowResize();
    });
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    if (this.racket) {
      this.racket.rotation.y += 0.005;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
