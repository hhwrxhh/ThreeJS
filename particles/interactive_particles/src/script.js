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
    this.camera.position.z = 3

    this.scene = new THREE.Scene()
    this.clock = new THREE.Clock()

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true

    this.isPlaying = true
    this.setupFBO()
    this.addMesh()

    // this.createGui()

    window.addEventListener('resize', this.resize.bind(this))
    this.render()
  }

  getRenderTarget() {
     return new THREE.WebGLRenderTarget(sizes.width, sizes.height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
     })
  }

  setupFBO() {
    this.size = 128 * 2
    this.fbo = this.getRenderTarget() 
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
    this.fboTexture = new THREE.DataTexture(this.data, this.size, this.size, THREE.RGBAFormat, THREE.FloatType)
    this.fboTexture.magFilter = THREE.NearestFilter
    this.fboTexture.minFilter = THREE.NearestFilter
    this.fboTexture.needsUpdate = true


    let geometry = new THREE.PlaneGeometry(2, 2)
    this.fboMaterial = new THREE.ShaderMaterial({
      vertexShader: simVertex,
      fragmentShader: simFragment,
      uniforms: {
        uPosition: { value: this.fboTexture },
        uInfo: { value: null }, 
        uTime: { value: 0 }
      }
    })

    this.infoArray = new Float32Array(this.size * this.size * 4) // 4 is rgba values
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        let index = (i + j * this.size) * 4 // flat index of the this.infoArray

        this.infoArray[index + 0] = 0.5 + Math.random()
        this.infoArray[index + 1] = 0.5 + Math.random()
        this.infoArray[index + 2] = 1.
        this.infoArray[index + 3] = 1.
      }    
    } 
    this.info = new THREE.DataTexture(this.infoArray, this.size, this.size, THREE.RGBAFormat, THREE.FloatType)
    this.info.magFilter = THREE.NearestFilter
    this.info.minFilter = THREE.NearestFilter
    this.info.needsUpdate = true
    this.fboMaterial.uniforms.uInfo.value = this.info

    this.fboMesh = new THREE.Mesh(geometry, this.fboMaterial)
    this.fboScene.add(this.fboMesh)
  
    this.renderer.setRenderTarget(this.fbo)
    this.renderer.render(this.fboScene, this.fboCamera)
    this.renderer.setRenderTarget(this.fbo1)
    this.renderer.render(this.fboScene, this.fboCamera)
  }

  addMesh() {

    this.count = this.size ** 2
    let geometry = new THREE.BufferGeometry()
    let positions = new Float32Array(this.count * 3)
    let uv = new Float32Array(this.count * 2)
    
    this.material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uPosition: { value: null },
        uTime: { value: 0 }
      },
      transparent: true
    })  

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        let index = (i + j * this.size) 
        
        positions[index * 3 + 0] = Math.random()
        positions[index * 3 + 1] = Math.random()
        positions[index * 3 + 2] = 0 
        uv[index * 2 + 0] = i / this.size
        uv[index * 2 + 1] = j / this.size
      }    
    } 
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2))

    this.material.uniforms.uPosition.value = this.fboTexture
    this.points = new THREE.Points(geometry, this.material)
    this.scene.add(this.points)
  }

  render() {
    if (!this.isPlaying) return

    const elapsedTime = this.clock.getElapsedTime()
    this.controls.update()
    this.fboMaterial.uniforms.uTime.value = elapsedTime
    this.material.uniforms.uTime.value = elapsedTime
    window.requestAnimationFrame(this.render.bind(this))

    this.fboMaterial.uniforms.uPosition.value = this.fbo1.texture
    this.material.uniforms.uPosition.value = this.fbo.texture


    this.renderer.setRenderTarget(this.fbo)
    this.renderer.render(this.fboScene, this.fboCamera)
    this.renderer.setRenderTarget(null)
    this.renderer.render(this.scene, this.camera)

    // swap render targets
    let tmp = this.fbo
    this.fbo = this.fbo1
    this.fbo1 = tmp
  
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
