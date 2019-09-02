#version 300 es

precision highp float;

in vec4 vertexcolour;

layout(location = 0) out vec4 fragcolour;
layout(location = 1) out uint id;

void main() {
    fragcolour = vertexcolour;
    id = 1u;
}
