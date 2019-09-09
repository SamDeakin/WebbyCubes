#version 300 es

precision highp float;

in vec2 texuv;

out vec4 fragcolour;

uniform sampler2D u_sampler;

// Bottom left, top right
uniform vec2 u_blurred_area[2];
uniform vec2 u_render_area;

uniform int u_kernel_size;
uniform float u_kernel_weights[64]; // 64 is the max kernel size
uniform float u_kernel_darkening;

void main() {
    float y = 1.0 - texuv.y;
    float x = texuv.x;
    // We can expect this branch to be largely spacially coherent, so most warps will
    // have every thread early exit or continue past.
    if (x <= u_blurred_area[0].x || u_blurred_area[1].x <= x ||
        y <= u_blurred_area[1].y || u_blurred_area[0].y <= y) {
        fragcolour = texture(u_sampler, texuv);
        return;
    }

    // This will produce visual artifacts when too close to the edge of the texture.
    // The only way to reliably solve this is to render more pixels than needed so there
    // is data to sample there. Strategies like only sampling inside [0,1] don't help
    // enough visually to be worth the branching speed penalty.
    vec3 totalColour = vec3(0.0);
    for (int i = -u_kernel_size; i <= u_kernel_size; i++) {
        for (int j = -u_kernel_size; j <= u_kernel_size; j++) {
            vec2 pos = texuv + vec2(i, j) / u_render_area;
            float weight = u_kernel_weights[abs(i)] * u_kernel_weights[abs(j)];
            // The exp (and log later) are for good colour blending. Colours should
            // be combined on a logarithmic scale or you get weird dark borders between
            // transitions.
            totalColour += exp(texture(u_sampler, pos).xyz) * weight;
        }
    }

    // This darkening is what makes the effect actually work.
    // It doesn't look good without it.
    vec3 finalColour = log(totalColour) * u_kernel_darkening;
    fragcolour = vec4(finalColour, 1.0);
}
