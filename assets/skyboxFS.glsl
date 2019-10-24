#version 300 es

precision highp float;

layout(location = 0) out vec4 fragcolour;
layout(location = 1) out vec4 id;

in vec3 world_direction;

float PI_BY_2 = 1.57079632679489661;

vec3 colour_horizon = vec3(237.0, 51.0, 28.0) / 255.0;

vec3 colour_up = vec3(145.0, 91.0, 161.0) / 255.0;

void main() {
    // We compute the rise above the horizon
    vec3 horizon_plane_normal = vec3(0.0, 1.0, 0.0);
    float sky_dot_horizon = dot(normalize(world_direction), horizon_plane_normal);
    float vertical_angle = asin(sky_dot_horizon);

    vec3 colour = mix(colour_horizon, colour_up, vertical_angle / PI_BY_2);

    fragcolour = vec4(colour, 1.0);

    // The skybox is always behind everything else
    gl_FragDepth = 1.0;
    // Set a special no-placement value representing the skybox
    id = vec4(vec3(0.0), 254.0 / 255.0);
}
