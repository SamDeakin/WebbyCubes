#version 300 es

precision highp float;

layout(location = 0) out vec4 fragcolour;
layout(location = 1) out vec4 id;

void main() {
    fragcolour = vec4(1.0, 1.0, 0.0, 1.0);
    id = vec4(1.0, 1.0, 1.0, 1.0);
}