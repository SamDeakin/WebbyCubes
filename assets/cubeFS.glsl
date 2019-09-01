#version 300 es

precision highp float;

in vec4 vertexcolour;

out vec4 fragcolour;

void main() {
    fragcolour = vertexcolour;
}
