import * as THREE from 'three';
import GUI from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'


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
    this.camera.position.set(0, 0.0, 0.1);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0xffffff );
    this.clock = new THREE.Clock();

    this.numPlanes = 90;
    this.meshes = []
    this.materials = []

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; 

    this.addMesh();

    // this.createGui();

    window.addEventListener('resize', this.resize.bind(this));
    this.render();
  }

  addMesh() {

    const getMaterial = (level) => {
      let material = new THREE.ShaderMaterial({
        transparent: true,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0},
          uLevel: { value: level},
        }
      });

      material.uniforms.uTime.value = level * Math.PI * 2;
      return material;
    }
    let geometry = new THREE.PlaneGeometry(2, 2, 2, 2);
    
    for (let i = 0; i < this.numPlanes; i++) {
      let material = getMaterial(i / 30);
      let tmpMesh = new THREE.Mesh(geometry, material);

      tmpMesh.position.z =  -0.1 * i; 
      this.scene.add(tmpMesh);
      this.meshes.push(tmpMesh);
      this.materials.push(material)
    }
  }



  render() {
    const elapsedTime = this.clock.getElapsedTime();

    // this.mesh.rotation.x = Math.sin(elapsedTime);
    // this.mesh.rotation.y = Math.cos(elapsedTime);

    this.materials.forEach((material, i) => {

    })

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
