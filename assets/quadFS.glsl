#version 300 es

precision highp float;

in vec2 texuv;

out vec4 fragcolour;

uniform sampler2D u_sampler;

void main() {
    fragcolour = texture(u_sampler, texuv);
}
