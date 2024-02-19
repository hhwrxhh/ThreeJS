import * as THREE from 'three'
import GUI from 'lil-gui'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import vertexShader from './shaders/vertexParticles.glsl'
import simVertex from './shaders/simVertex.glsl'
import fragmentShader from './shaders/fragment.glsl'
import simFragment from './shaders/simFragment.glsl'

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

export default class Sketch {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(sizes.width, sizes.height)
    document.getElementById('container').appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(70, sizes.width / sizes.height, 0.01, 10)
    this.camera.position.z = 1

    this.scene = new THREE.Scene()
    this.clock = new THREE.Clock()

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true

    this.setupFBO()
    this.addMesh()

    // this.createGui()

    window.addEventListener('resize', this.resize.bind(this))
    this.render()
  }

  getRenderTarget() {
     return new THREE.WebGLRenderTarget(this.width, this.height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
     })
  }

  setupFBO() {
    this.size = 128
    this.fbo0 = this.getRenderTarget() 
    this.fbo1 = this.getRenderTarget() 
  
    this.fboScene = new THREE.Scene()
    this.fboCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1)
    this.fboCamera.position.set(0, 0, 0.5)
    this.fboCamera.lookAt(0, 0, 0)

    this.data = new Float32Array(this.size * this.size * 4) // 4 is rgba values
    
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        let index = (i + j * this.size) * 4 // flat index of the this.data

        // donut
        let theta  = Math.random() * Math.PI * 2
        let r = 0.5 + 0.5 * Math.random()
        this.data[index + 0] = r *  Math.cos(theta)
        this.data[index + 1] = r * Math.sin(theta)
        this.data[index + 2] = 1.
        this.data[index + 3] = 1.
      }    
    } 
    console.log(this.data)
    this.fboTexture = new THREE.DataTexture(this.data, this.size, this.size, THREE.RGBAFormat, THREE.FloatType )
    this.fboTexture.magFilter = THREE.NearestFilter
    this.fboTexture.minFilter = THREE.NearestFilter
    this.fboTexture.needsUpdate = true


    let geometry = new THREE.PlaneGeometry(2, 2)
    this.fboMaterial = new THREE.ShaderMaterial({
      vertexShader: simVertex,
      fragmentShader: simFragment,
      uniforms: {
        uPosition: { value: this.fboTexture },
        uTime: { value: 0 }
      }
    })
    this.fboMesh = new THREE.Mesh(geometry, this.fboMaterial)
    this.fboScene.add(this.fboMesh)
  
  }

  addMesh() {

    this.count = this.size ** 2
    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1)

    this.material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uPosition: { value: null },

      }
    })

    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.scene.add(this.mesh)
  }

  render() {
    const elapsedTime = this.clock.getElapsedTime()
    this.controls.update()
    this.fboMaterial.uniforms.uTime.value = elapsedTime
    this.renderer.render(this.scene, this.camera)
    window.requestAnimationFrame(this.render.bind(this))

    // this.renderer.setRenderTarget(null)
    // this.renderer.render(this.fboScene, this.fboCamera)
}
  resize() {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    this.camera.aspect = sizes.width / sizes.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(sizes.width, sizes.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  }

  createGui() {
    this.gui = new GUI({ width: 400 })
  }
}

new Sketch()
