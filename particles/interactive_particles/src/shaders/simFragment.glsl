precision mediump float;

uniform sampler2D uPosition;

varying vec2 vUv;

void main() {
    vec4 pos = texture2D(uPosition, vUv);
    gl_FragColor = pos;
}