#version 300 es

precision highp float;

in vec2 texuv;

out vec4 fragcolour;

uniform sampler2D u_sampler;

uniform float u_blurredArea; // percent from the top
uniform vec2 u_renderArea;

void main() {
    fragcolour = texture(u_sampler, texuv);

    float height = 1.0 - texuv.y;
    if (height > u_blurredArea)
        return;

    fragcolour = vec4(1.0, 0.0, 0.0, 1.0);
}
