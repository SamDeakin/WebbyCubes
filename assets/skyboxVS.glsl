#version 300 es

layout(location = 0) in vec3 a_position;

uniform mat4 u_perspective;
uniform mat4 u_view;
uniform mat4 u_view_inverse;

out vec3 world_direction;

void main() {
    // Truncate the view matrix to remove translation
    mat4 modelview = mat4(mat3(u_view));

    vec4 view_pos = modelview * vec4(a_position, 1.0);
    gl_Position = u_perspective * view_pos;

    world_direction = mat3(u_view_inverse) * view_pos.xyz;
}
