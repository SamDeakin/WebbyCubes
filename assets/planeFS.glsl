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

// Extra data used to "supersample" the grid without actually supersampling
in vec3 plane_point;
in vec3 plane_normal;
in vec3 line_point2;
in vec4 camera_point;
float grid_expand_speed = 100.0;
float grid_expand_min = 15.0;
float grid_fade_min = 0.1;
float grid_fade_speed = 30.0;
float grid_fade_value = 0.0;

vec2 get_plane_point(vec4 point) {
    // Project back, and take the 3D coords to get the algebraic eqn of a line
    vec4 line_point1_4D = u_view_inverse * u_perspective_inverse * point;
    vec3 line_point1 = line_point1_4D.xyz / line_point1_4D.w;
    vec3 line_dir = line_point1 - line_point2;

    // Intersect line with plane
    float d = dot((plane_point - line_point1), plane_normal) / dot(line_dir, plane_normal);
    vec3 intersection = d * line_dir + line_point1;

    // Pass intersecting point
    return intersection.xz;
}

float grid_distance(vec2 position) {
    vec2 distance = fract(position - 0.5);
    vec2 distance_inverse = 1.0 - distance;
    return min(min(distance.x, distance.y), min(distance_inverse.x, distance_inverse.y));
}

void main() {
    // Nudge the camera one pixel over and see how far away on the plane that is
    vec2 pixel = 2.0 / u_viewport_size;
    vec4 point2 = camera_point;
    point2.xy += pixel;
    vec2 world_position_2 = get_plane_point(point2);
    vec4 point3 = camera_point;
    point3.xy -= pixel;
    vec2 world_position_3 = get_plane_point(point3);
    float point_distance = distance(world_position_2, world_position_3);

    // Closest distance to a side of the grid
    float min_distance = grid_distance(world_position);

    // Here, a value of 0 means on the grid, and we lerp towards transparent
    // within fade_delta distance of 0
    float distance_test = min_distance - distance_threshold;
    float fade_delta = pow(point_distance * grid_expand_speed, grid_expand_min);
    float distance_lerp = (distance_test + fade_delta) / fade_delta;
    float grid_intensity = mix(1.0, 0.0, distance_lerp);

    // Obscure and tend towards a flat alpha value as point_distance grows
    float lerp = clamp(point_distance * grid_fade_speed - grid_fade_min, 0.0, 1.0);
    float intensity = mix(grid_intensity, grid_fade_value, lerp);
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
