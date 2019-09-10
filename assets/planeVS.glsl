#version 300 es

layout(location = 0) in vec3 a_position;

uniform mat4 u_perspective;
uniform mat4 u_view;
uniform mat4 u_view_inverse;

void main() {
    gl_Position = u_perspective * u_view * vec4(a_position, 1.0);
}