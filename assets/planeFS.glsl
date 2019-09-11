#version 300 es

precision highp float;

layout(location = 0) out vec4 fragcolour;
layout(location = 1) out vec4 id;

in vec2 world_position;
in vec3 object_eye;

vec3 object_normal = vec3(0.0, 1.0, 0.0);
float distance_threshold = 0.015;

void main() {
    vec2 distance = fract(world_position - 0.5);
    vec2 low_distance = sign(max(distance_threshold - distance, 0.0));
    vec2 high_distance = sign(max(distance - (1.0 - distance_threshold), 0.0));

    float total_distance = low_distance.x + low_distance.y + high_distance.x + high_distance.y;
    fragcolour = vec4(1.0) * sign(total_distance);

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
