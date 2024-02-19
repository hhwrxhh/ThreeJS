precision mediump float;

uniform sampler2D uPosition;

varying vec2 vUv;

void main() {
    vec4 pos = texture2D(uPosition, vUv);

    // pos.xy += vec2(0.01);
    gl_FragColor = vec4(pos.xy, 1., 1.);
}