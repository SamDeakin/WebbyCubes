#version 300 es

precision highp float;

layout(location = 0) out vec4 fragcolour;
layout(location = 1) out vec4 id;

uniform mat4 u_perspective_inverse;
uniform mat4 u_view_inverse;
uniform vec2 u_viewport_size;

in vec2 world_position;
in vec3 object_eye;
in vec3 object_normal;

in vec3 perspective_eye;
in vec3 perspective_normal;

float distance_threshold = 0.025;
float PI_BY_2 = 1.57079632679489661;

float on_grid(vec2 position, float threshold) {
    vec2 distance = fract(position - 0.5);
    vec2 low_distance = sign(max(threshold - distance, 0.0));
    vec2 high_distance = sign(max(distance - (1.0 - threshold), 0.0));

    float total_distance = low_distance.x + low_distance.y + high_distance.x + high_distance.y;
    return sign(total_distance);
}

void main() {
    // We transform the eye here because it doesn't seem to interpolate correctly
    // if we do it in the VS
    vec3 eye = perspective_eye * gl_FragCoord.w;

    vec2 dx = abs(dFdx(world_position));
    vec2 dy = abs(dFdy(world_position));
    float maxdxy = max(max(dx.x, dx.y), max(dy.x, dy.y));

    // If dxy is larger than the threshold, then we expand the threshold to be dxy
    // and add proportional opacity
    float threshold = max(distance_threshold, maxdxy);
    float difference = max(0.0, maxdxy - distance_threshold);

    float grid_intensity = on_grid(world_position, threshold);

    // Modify the intensity proportionally so that a dx or dy of 1.0 or greater is opacity 0
    float intensity_mod = difference / (1.0 - 2.0 * distance_threshold);
    float intensity = max(grid_intensity - intensity_mod, 0.0);

    fragcolour = vec4(vec3(1.0), 1.0 * intensity);

    if (gl_FragCoord.x < u_viewport_size.x * 0.5) {
        fragcolour = vec4(0.0);
        fragcolour.a = 1.0;
        fragcolour.r = difference;
        // fragcolour.gb = dx;
        fragcolour.gb = dy;
    }

    // We encode the id for the current position a bit weirdly
    // x and y are the absolute world position
    vec3 idvec = vec3(abs(world_position), 0.0);
    // z is a bitmask for whether x and y are above or below 0
    // With one extra component to say whether we are looking from above or below
    // the plane.
    ivec2 idz = max(-sign(ivec2(world_position - 0.5)), 0);
    int below = max(int(-sign(dot(object_eye, object_normal))), 0);
    idvec.z = float(idz.x + (idz.y << 1) + (below << 2));

    // Here 255 is important because alpha blending is on for this pass
    // It allows us to write directly to x,y without blending.
    id = vec4(idvec / 255.0, 255.0);
}
