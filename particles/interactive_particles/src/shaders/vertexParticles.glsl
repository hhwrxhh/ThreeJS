varying vec2 vUv;
uniform float uTime;
varying vec3 vPosition;
uniform sampler2D uPosition;

void main() {
    vec4 pos = texture2D(uPosition, uv);
    vec4 mvPosition = modelViewMatrix  * vec4(pos.xyz, 1.);
    gl_PointSize = 10. * (1. / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    vUv = uv;
}