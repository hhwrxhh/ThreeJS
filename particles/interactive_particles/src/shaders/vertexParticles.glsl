varying vec2 vUv;
uniform float uTime;
varying vec3 vPosition;
varying vec4 vColor;
uniform sampler2D uPosition;

void main() {
    vec4 pos = texture2D(uPosition, uv);
    float angle = atan(pos.y, pos.x);
    vColor = 0.7 * vec4(0.5 + 0.45 * sin(angle + uTime * 0.4));
    
    vec4 mvPosition = modelViewMatrix  * vec4(pos.xyz, 1.);
    gl_PointSize = 1. * (1. / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    vUv = uv;
}