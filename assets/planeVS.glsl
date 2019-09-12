#version 300 es

layout(location = 0) in vec3 a_position;

uniform mat4 u_perspective;
uniform mat4 u_view;
uniform mat4 u_view_inverse;
uniform vec2 u_viewport_size;

out vec2 world_position;
out vec3 object_eye;
out float depth;
out float width;

void main() {
    vec4 view_pos = u_view * vec4(a_position, 1.0);
    gl_Position = u_perspective * view_pos;
    world_position = a_position.xz;

    vec4 view_eye = vec4(view_pos.xyz * -1.0 / view_pos.w, 0.0);
    vec4 object_eye_pos = u_view_inverse * view_eye;
    object_eye = normalize(object_eye_pos.xyz);

    depth = gl_Position.z;

    vec4 camera_dir2 = gl_Position;
    float pixelWidth = 1.0 / (2.0 * u_viewport_size.x);
    camera_dir2.x += pixelWidth;
    camera_dir2.w = 0;
    // Project back
    vec4 view_dir2 = normalize(u_perspective_inverse * camera_dir2);

    // Intersect with plane

    // Pass intersecting point
}
