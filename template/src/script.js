import * as THREE from 'three';
import GUI from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import vertexShader from './shaders/vertex.glsl'
// import fragmentShader from './shaders/fragment.glsl'


const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

export default class Sketch {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(sizes.width, sizes.height);
    document.getElementById('container').appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(70, sizes.width / sizes.height, 0.01, 10);
    this.camera.position.z = 1;

    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; 

    this.addMesh();

    // this.createGui();

    window.addEventListener('resize', this.resize.bind(this));
    this.render();
  }

  addMesh() {
    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

    // this.material = new THREE.ShaderMaterial({
    //   vertexShader: vertexShader,
    //   fragmentShader: fragmentShader
    // })
    this.material = new THREE.MeshBasicMaterial({ color: '#ff00ff', side: THREE.DoubleSide });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime();

    this.mesh.rotation.x = Math.sin(elapsedTime);
    this.mesh.rotation.y = Math.cos(elapsedTime);

    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    window.requestAnimationFrame(this.render.bind(this));
  }

  resize() {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    this.camera.aspect = sizes.width / sizes.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(sizes.width, sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  createGui() {
    this.gui = new GUI({ width: 400 });
  }
}

new Sketch();
