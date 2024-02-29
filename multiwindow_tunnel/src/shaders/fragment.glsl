precision mediump float;

varying vec2 vUv;
uniform float uLevel;
uniform float uTime;


float sdCircle( vec2 p, float r )
{
    return length(p) - r;
}

float sdBox( in vec2 p, in vec2 b )
{
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.283 * (c * t + d));
}

vec3 a = vec3(0.8, 0.5, 0.4);		
vec3 b = vec3(0.2, 0.4, 0.2);	
vec3 c = vec3(2.0, 1.0, 1.0);	
vec3 d = vec3(0.00, 0.25, 0.25);

void main() {
    
    vec2 uv = vUv - vec2(0.5);

    float scene = mix(
        sdCircle(uv, 0.2), 
        sdBox(uv, vec2(0.2)), 
        (sin(uLevel * 3.15 * 2.) + 1.) * 0.5
    );
    // float scene = sdBox(uv, vec2(0.2));
    float d = scene;

    vec3 col = (d>0.0) ? vec3(0.9,0.6,0.3) : vec3(0.65,0.85,1.0);
    col *= 1.0 - exp(-6.0*abs(d));
	col *= 0.8 + 0.2*cos(150.0*d);
	col = mix( col, vec3(1.0), 1.0-smoothstep(0.0,0.01,abs(d)) );
    
    if (scene < 0.0) {
        discard;
    }

    gl_FragColor = vec4(vec3(col), 0.3);
}