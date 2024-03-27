import * as THREE from 'three';
import GUI from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import ao from '/textures/texture-ambient-occlusion.png'
import bar from '/models/bar.glb?url'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const setting = {
  progress: 0,
}
let mouseX, mouseY;
export default class Sketch {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(sizes.width, sizes.height);
    document.getElementById('container').appendChild(this.renderer.domElement);
   

    // this.camera = new THREE.PerspectiveCamera(70, sizes.width / sizes.height, 0.01, 10);
    // this.camera.position.z = 2;

    this.addCamera();
    this.model = null;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x08092d);
    this.clock = new THREE.Clock();
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; 
    
    this.setupFBO();
    this.addMesh()
    this.addLight();
    this.addObjects();

    this.createGui();

    window.addEventListener('resize', this.resize.bind(this));
    window.addEventListener('mousemove', this.updateSpotLightPosition.bind(this))
    // window.addEventListener('mousemove', this.checkIntersections.bind(this))
    ;
    this.render();
  }

  addCamera() {
    let frustumSize = sizes.height;
    let apsect = sizes.width / sizes.height;
    this.camera = new THREE.OrthographicCamera(
      frustumSize * apsect / -2,
      frustumSize * apsect / 2,
      frustumSize / 2,
      frustumSize / -2,
      -1000, 
      1000
    )
    
    this.camera.position.set(2, 2, 2);
  }
  
  setupFBO() {
    this.fbo = new THREE.WebGLRenderTarget(sizes.width, sizes.height);
    this.fboCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
    this.fboScene = new THREE.Scene();
    this.fboMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFBO: { value: null},
        uState1: { value: new THREE.TextureLoader().load('/textures/fbo.png')},
        uState2: { value: new THREE.TextureLoader().load('/textures/map.png')},
        uProgress: { value: 0 },

      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    })

    this.fboGeo = new THREE.PlaneGeometry(2, 2);
    this.fboQuad = new THREE.Mesh(this.fboGeo, this.fboMaterial);
    this.fboScene.add(this.fboQuad); 
  }

  addObjects() {

    this.debug = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshBasicMaterial({
        map: this.fbo.texture
      })
    )
    this.debug.position.y = 150;
    this.scene.add(this.debug);

    this.dracoLoader = new DRACOLoader()
    this.dracoLoader.setDecoderPath('/draco/')
    
    this.aoTexture = new THREE.TextureLoader().load(ao);
    this.aoTexture.flipY = false;
  
    this.material = new THREE.MeshPhysicalMaterial({
      roughness: 0.75,
      map: this.aoTexture,
      aoMap: this.aoTexture,
      aoMapIntensity: 0.75,
    })

    this.uniforms = {
      uTime: { value: 0 },
      uFBO: { value: null },
      aoMap: {value: this.aoTexture },
      light_color: { value: new THREE.Color('#ffe9e9') },
      ramp_color_one: { value: new THREE.Color('#06082D') }, ramp_color_two: { value: new THREE.Color('#020284') }, ramp_color_three: { value: new THREE. Color('#0000ff') }, ramp_color_four: { value: new THREE.Color('#71c7f5') },

    }
    this.material.onBeforeCompile = (shader) => {
      shader.uniforms = Object.assign(shader.uniforms, this.uniforms);

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        uniform sampler2D uFBO;
        uniform float uTime;
        attribute vec2 aInstanceUV;
        varying float vHeight;
        varying float vHeightUV;
        `
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>

        vec4 transition = texture2D(uFBO, aInstanceUV);
        transformed *= transition.g; // other meshes are avaible
        transformed.y += transition.r * 100.; // other meshes are avaible
        // but its scales are zer0 (0.3 + transition.g)
        vHeight = transformed.y;
        vHeightUV = clamp(position.y * 2., 0., 1.);
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
        #include <common>
        uniform vec3 light_color;
        uniform vec3 ramp_color_one;
        uniform vec3 ramp_color_two;
        uniform vec3 ramp_color_three;
        uniform vec3 ramp_color_four;

        varying float vHeight;
        varying float vHeightUV;
        `
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `
        #include <color_fragment>

        vec3 highlight = mix(ramp_color_three, ramp_color_four, vHeightUV);
        diffuseColor.rgb = ramp_color_two;
        diffuseColor.rgb =  mix(diffuseColor.rgb, ramp_color_three, vHeightUV);
        diffuseColor.rgb =  mix(diffuseColor.rgb, highlight, clamp(vHeight / 10. -3., 0., 1.));
        `
      );
    }

    this.gltfLoader = new GLTFLoader()
    this.gltfLoader.setDRACOLoader(this.dracoLoader)
    this.gltfLoader.load(
        '/models/bar.glb',
        (gltf) => {
          this.model = gltf.scene.children[0];
          this.scene.add(this.model);
          console.log(this.model)
          this.model.material = this.material;

          this.geometry = this.model.geometry;
          this.geometry.scale(40, 40, 40);

          this.iSize = 60;
          this.instances = this.iSize ** 2;
          this.instancedMesh = new THREE.InstancedMesh(
            this.geometry,
            this.material,
            this.instances
          );
          
          let instanceUV = new Float32Array(this.instances * 2)
          let dumny = new THREE.Object3D();
          let wid = 70;
          for (let i = 0; i < this.iSize; i++) {
            for (let j = 0; j < this.iSize; j++) {

              instanceUV.set([i / this.iSize, j / this.iSize], (i *  this.iSize + j) * 2);
              
              // instanceUV[i * this.iSize + j] = i / this.iSize;
              // instanceUV[i * this.iSize + j] = j / this.iSize;

              dumny.position.set(
                wid * (i - this.iSize / 2),
                0,
                wid * (j - this.iSize / 2),
              );
              dumny.updateMatrix();
              this.instancedMesh.setMatrixAt(i * this.iSize + j, dumny.matrix);
            }
          }
          this.geometry.setAttribute('aInstanceUV', new THREE.InstancedBufferAttribute(instanceUV, 2)); 
          this.scene.add(this.instancedMesh);
        }
    )
  }


  addMesh() {
  }

  addLight() {
    const light = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(light);
    
 
    this.spotLight = new THREE.SpotLight(0xffe9e9, 3000);
    this.spotLight.position.set(-80, 1500, -80);
    let target = new THREE.Object3D();
    target.position.set(0, 0, 0); 
    // this.spotLight.target = target;
    this.spotLight.intensity = 3000;
    this.spotLight.angle = 0.1;
    this.spotLight.penumbra = 1.5;
    this.spotLight.decay = 0.7;
    // this.spotLight.distance = 3000;
    this.scene.add(this.spotLight);
    console.log(this.spotLight)
    this.spotLightHelper = new THREE.SpotLightHelper( this.spotLight );
    this.scene.add( this.spotLightHelper );

  }

  updateSpotLightPosition(event) {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    // Отримуємо позицію курсора миші у відповідних координатах ортографічної камери
    const vecX = (mouseX * sizes.width);
    const vecY = - (mouseY * sizes.height);

    let target = new THREE.Object3D();
    // target.position.set(vecX, 1500, vecY); 
    // Оновлюємо позицію цільової точки світла
    this.spotLightHelper.position.copy(new THREE.Vector3(vecX, 1500, vecY));
    // this.spotLight.target = target.position.set(vecX, 1500, vecY)
    this.spotLight.target.updateMatrixWorld();
    
    
  }

  checkIntersections(event) {
    // Отримуємо позицію курсора миші у відповідних координатах ортографічної камери
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    // Створюємо промінь з положенням курсора миші
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x: mouseX, y: mouseY }, this.camera);

    // Отримуємо список об'єктів, з якими промінь перетинається
    const intersects = raycaster.intersectObjects(this.scene.children, true);
    // Перевіряємо, чи є перетини, і виводимо позиції кубів у консоль
    if (intersects.length > 0) {
        console.log("Перетин з кубом:");
        intersects.forEach((intersection) => {
            if (intersection.object instanceof THREE.InstancedMesh) {
                // console.log(intersection.point);
            }
        });
    }
  }


  render() {
    const elapsedTime = this.clock.getElapsedTime();
   
    this.controls.update();
    
    window.requestAnimationFrame(this.render.bind(this));
    
    this.renderer.setRenderTarget(this.fbo);
    this.renderer.render(this.fboScene, this.fboCamera);
    
    this.renderer.setRenderTarget(null);
    this.uniforms.uFBO.value = this.fbo.texture;
    this.renderer.render(this.scene, this.camera);
    
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
    this.gui.add(setting, 'progress').min(0.0).max(1).onChange((val) => {
      this.fboMaterial.uniforms.uProgress.value = val;
    })
  }
}

new Sketch();
