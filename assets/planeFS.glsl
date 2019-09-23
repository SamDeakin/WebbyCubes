#version 300 es

precision highp float;

layout(location = 0) out vec4 fragcolour;
layout(location = 1) out vec4 id;

uniform mat4 u_perspective_inverse;
uniform mat4 u_view_inverse;
uniform vec2 u_viewport_size;

in vec2 world_position;
in vec3 object_eye;

vec3 object_normal = vec3(0.0, 1.0, 0.0);
float distance_threshold = 0.025;

float on_grid(vec2 position, float threshold) {
    vec2 distance = fract(position - 0.5);
    vec2 low_distance = sign(max(threshold - distance, 0.0));
    vec2 high_distance = sign(max(distance - (1.0 - threshold), 0.0));

    float total_distance = low_distance.x + low_distance.y + high_distance.x + high_distance.y;
    return sign(total_distance);
}

void main() {
    float threshold = distance_threshold;
    float grid_intensity = on_grid(world_position, threshold);
    fragcolour = vec4(vec3(1.0), 1.0 * grid_intensity);

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
