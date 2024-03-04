varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    vUv = uv;
}
