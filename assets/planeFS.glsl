#version 300 es

precision highp float;

layout(location = 0) out vec4 fragcolour;
layout(location = 1) out vec4 id;

in vec2 world_position;

float distance_threshold = 0.015;

float total(vec4 vector) {
    return vector.x + vector.y + vector.z + vector.w;
}

float total(vec3 vector) {
    return vector.x + vector.y + vector.z;
}

void main() {
    vec4 distance = fract(vec4(world_position - 0.5, world_position + 0.5));
    vec4 low_distance = sign(max(distance_threshold - distance, 0.0));
    vec4 high_distance = sign(max(distance - (1.0 - distance_threshold), 0.0));

    float total_distance = total(high_distance) + total(low_distance);
    fragcolour = vec4(1.0) * sign(total_distance);

    // Here 255 is important because alpha blending is on for this pass
    // It allows us to write directly to x,y without blending.
    id = vec4(255.0, 255.0, 0.0, 255.0);
}