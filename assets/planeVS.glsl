#version 300 es

layout(location = 0) in vec3 a_position;

uniform mat4 u_perspective;
uniform mat4 u_perspective_inverse;
uniform mat4 u_view;
uniform mat4 u_view_inverse;

out vec2 world_position;
out vec3 object_eye;
out vec3 object_normal;

out vec3 perspective_eye;
out vec3 perspective_normal;

vec3 plane_normal = vec3(0.0, 1.0, 0.0);

void main() {
    vec4 view_pos = u_view * vec4(a_position, 1.0);
    gl_Position = u_perspective * view_pos;
    world_position = a_position.xz;

    vec4 view_eye_dir = vec4(view_pos.xyz * -1.0 / view_pos.w, 0.0);
    object_eye = normalize((u_view_inverse * view_eye_dir).xyz);

    object_normal = plane_normal;

    perspective_eye = gl_Position.xyz * -1.0;
    vec4 normal_dir = vec4(plane_normal, 0.0);
    perspective_normal = normalize((u_perspective * u_view * normal_dir).xyz);
}
