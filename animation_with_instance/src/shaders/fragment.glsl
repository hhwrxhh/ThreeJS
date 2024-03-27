precision mediump float;

uniform float uProgress;
uniform sampler2D uState1;
uniform sampler2D uState2;

varying vec2 vUv;

void main() {

    
    vec4 color = texture2D(uState1, vUv);
    vec4 color2 = texture2D(uState2, vec2(vUv.x, 1. - vUv.y));

    float radius = 1.41;
    float dist = distance(vUv, vec2(0.5));
    float outerProgress = clamp(1.1 * uProgress, 0., 1.);
    float innerProgress = clamp(1.1 * uProgress - 0.05, 0., 1.);

    float innerCircle = 1. - smoothstep((innerProgress - 0.1)* radius, innerProgress * radius, dist); 
    float outerCircle = 1. - smoothstep((outerProgress - 0.1)* radius, outerProgress * radius, dist); 

    float displacement = outerCircle - innerCircle;
    float scale = mix(color.r, color2.r, innerCircle);

    vec4 finalColor = mix(color, color2, uProgress); 
    gl_FragColor = finalColor;
    gl_FragColor = vec4(vec3(displacement, scale, 0.0), 1.0);
}