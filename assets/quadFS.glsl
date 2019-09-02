#version 300 es

precision highp float;

in vec2 texuv;

out vec4 fragcolour;

void main() {
    fragcolour = vec4(texuv, 0.0, 1.0);
}
