#version 300 es

precision highp float;

layout(location = 0) out vec4 fragcolour;
layout(location = 1) out vec4 id;

void main() {
    fragcolour = vec4(vec3(0.5), 1.0);

    // The skybox is always behind everything else
    gl_FragDepth = 1.0;

    // Set a special no-placement value representing the skybox
    id = vec4(vec3(0.0), 254.0 / 255.0);
}
