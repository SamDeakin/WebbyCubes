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
float distance_threshold = 0.015;

// Extra data used to "supersample" the grid without actually supersampling
in vec3 plane_point;
in vec3 plane_normal;
in vec3 line_point2;
in vec4 camera_point;

in vec3 test;
in vec3 test2;

vec2 calc_second_point() {
    vec4 camera_point2 = camera_point;
    float pixelWidth = 2.0 / (u_viewport_size.x);
    camera_point2.x += pixelWidth;

    // Project back, and take the 3D coords to get the algebraic eqn of a line
    vec4 line_point1_4D = u_view_inverse * u_perspective_inverse * camera_point2;
    vec3 line_point1 = line_point1_4D.xyz / line_point1_4D.w;
    vec3 line_dir = line_point1 - line_point2;

    // Intersect line with plane
    float d = dot((plane_point - line_point1), plane_normal) / dot(line_dir, plane_normal);
    vec3 intersection = d * line_dir + line_point1;

    // Pass intersecting point
    return = intersection.xz;
}

void main() {
    vec2 distance = fract(world_position - 0.5);
    vec2 low_distance = sign(max(distance_threshold - distance, 0.0));
    vec2 high_distance = sign(max(distance - (1.0 - distance_threshold), 0.0));

    float total_distance = low_distance.x + low_distance.y + high_distance.x + high_distance.y;
    fragcolour = vec4(1.0) * sign(total_distance);

    // Nudge the camera one pixel over and see how far away on the plane that is
    vec2 world_position_2 = calc_second_point();

    // Determine how much of pixel is within line
    // Alpha blend
    fragcolour.x = world_position.y / 100.0;
    fragcolour.y = world_position_2.y / 100.0;
    fragcolour.z = length(world_position - world_position_2) * 100.0;
    // fragcolour.xy = abs(world_position - world_position_2);
    fragcolour.xy = world_position_2;
    fragcolour.w = 1.0;

    // TODO Get second intersection point and compare to world_position

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
