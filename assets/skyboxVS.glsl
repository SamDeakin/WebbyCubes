#version 300 es

layout(location = 0) in vec3 a_position;

uniform mat4 u_perspective;
uniform mat4 u_view;

void main() {
    // mat4 modelview = u_view;
    // vec4 view_pos = modelview * vec4(a_position, 1.0);
    // gl_Position = u_perspective * view_pos;
    gl_Position = u_perspective * vec4(a_position, 1.0);
}
