#version 300 es

precision highp float;

in vec2 texuv;

out vec4 fragcolour;

uniform sampler2D u_sampler;

uniform float u_blurredArea; // percent from the top
uniform vec2 u_renderArea;

uniform int u_kernel_size;
uniform float u_kernel_weights[64]; // 64 is the max kernel size
uniform float u_kernel_darkening;

void main() {
    float height = 1.0 - texuv.y;
    // We can expect this branch to be largely spacially coherent, so most warps will
    // have every thread early exit or continue past.
    if (height > u_blurredArea) {
        fragcolour = texture(u_sampler, texuv);
        return;
    }

    vec3 totalColour = vec3(0.0);
    for (int i = -u_kernel_size; i <= u_kernel_size; i++) {
        for (int j = -u_kernel_size; j <= u_kernel_size; j++) {
            vec2 pos = texuv + vec2(i, j) / u_renderArea;
            float weight = u_kernel_weights[abs(i)] * u_kernel_weights[abs(j)];
            totalColour += texture(u_sampler, pos).xyz * weight;
        }
    }

    // This darkening is what makes the effect actually work.
    // It doesn't look good without it.
    vec3 finalColour = totalColour * u_kernel_darkening;
    fragcolour = vec4(finalColour, 1.0);
}
