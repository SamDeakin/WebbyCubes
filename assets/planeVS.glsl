#version 300 es

layout(location = 0) in vec3 a_position;

uniform mat4 u_perspective;
uniform mat4 u_perspective_inverse;
uniform mat4 u_view;
uniform mat4 u_view_inverse;
uniform vec2 u_viewport_size;

out vec2 world_position;
out vec3 object_eye;
out float width;

// Extra positions used to "supersample" the grid without actually supersampling
out vec2 world_position_2;

void main() {
    vec4 view_pos = u_view * vec4(a_position, 1.0);
    gl_Position = u_perspective * view_pos;
    world_position = a_position.xz;

    vec4 view_eye = vec4(view_pos.xyz * -1.0 / view_pos.w, 0.0);
    vec4 object_eye_pos = u_view_inverse * view_eye;
    object_eye = normalize(object_eye_pos.xyz);

    // Nudge the camera just a bit right and see where on the plane we end up
    vec4 camera_point = gl_Position;
    float pixelWidth = 2.0 / (u_viewport_size.x);
    camera_point.x += pixelWidth;

    // Project back, and take the 3D coords to get the algebraic eqn of a line
    vec3 line_point1 = (u_view_inverse * u_perspective_inverse * camera_point).xyz;
    vec3 line_point2 = object_eye_pos.xyz;
    vec3 line_dir = line_point1 - line_point2;

    // Algebraic equation of a plane
    vec3 plane_point = a_position;
    vec3 plane_normal = vec3(0.0, 1.0, 0.0);

    // Intersect line with plane
    float d = dot((plane_point - line_point1), plane_normal) / dot(line_dir, plane_normal);
    vec3 intersection = d * line_dir + line_point1;

    // Pass intersecting point
    world_position_2 = intersection.xy;
}
