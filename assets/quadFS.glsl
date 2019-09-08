#version 300 es

precision highp float;

in vec2 texuv;

out vec4 fragcolour;

uniform sampler2D u_sampler;

uniform float u_blurredArea; // percent from the top
uniform vec2 u_renderArea;

void main() {
    float height = 1.0 - texuv.y;
    // We can expect this branch to be largely spacially coherent, so most warps will
    // have every thread early exit or continue past.
    if (height > u_blurredArea) {
        fragcolour = texture(u_sampler, texuv);
        return;
    }

    fragcolour = vec4(1.0, 0.0, 0.0, 1.0);
}
