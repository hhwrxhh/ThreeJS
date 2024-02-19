varying vec2 vUv;
uniform float uTime;
varying vec3 vPosition;
uniform sampler2D uPosition;

void main() {
    vec4 mvPosition = modelViewMatrix  * vec4(position, 1.);
    gl_PointSize = 1000. * (1. / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    vUv = uv;
}