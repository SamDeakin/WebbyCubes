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
float gradient_fadeout_threshold = 0.45;
float PI_BY_2 = 1.57079632679489661;

// Returns 1.0 when the position is within threshold of the grid, 0.0 otherwise.
// Takes into account dx and dy when calculating.
float on_grid(vec2 position, float threshold, vec2 dx, vec2 dy) {
    position = fract(position - 0.5);

    vec2 maxdist = vec2(0.0);
    maxdist = max(maxdist, ceil(position + dx + threshold) - ceil(position));
    maxdist = max(maxdist, ceil(position + dy + threshold) - ceil(position));
    maxdist = max(maxdist, floor(position) - floor(position - dx - threshold));
    maxdist = max(maxdist, floor(position) - floor(position - dy - threshold));

    // We have to ensure we test ceil and floor in the correct dx,dy directions
    // for example: in the case where the user rotates 180 degrees.
    // We could do some calculation on dx,dy values to avoid all 8 tests, but
    // it would probably be as much logic as just flipping the values and doing
    // twice as many tests.
    dx = -dx;
    dy = -dy;
    maxdist = max(maxdist, ceil(position + dx + threshold) - ceil(position));
    maxdist = max(maxdist, ceil(position + dy + threshold) - ceil(position));
    maxdist = max(maxdist, floor(position) - floor(position - dx - threshold));
    maxdist = max(maxdist, floor(position) - floor(position - dy - threshold));

    return max(maxdist.x, maxdist.y);
}

void main() {
    // We transform the eye here because it doesn't seem to interpolate correctly
    // if we do it in the VS
    vec3 eye = perspective_eye * gl_FragCoord.w;

    vec2 dx = dFdx(world_position);
    vec2 dy = dFdy(world_position);
    float grid_intensity = on_grid(world_position, distance_threshold, dx, dy);

    // Modify the intensity so that it is a value of 1.0 on grid when dx,dy < threshold
    // and scales down to 0.0 when dx,dy > threshold by more than the fadeout threshold
    float maxdxy = max(length(dx), length(dy));
    float intensity_mod = min(1.0, max(0.0, maxdxy - distance_threshold) / gradient_fadeout_threshold);
    float intensity = mix(grid_intensity, 0.0, intensity_mod);

    fragcolour = vec4(vec3(1.0), 1.0 * intensity);

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
