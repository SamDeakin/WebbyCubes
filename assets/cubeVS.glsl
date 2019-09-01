#version 300 es

in vec3 a_position;
in mat4 a_world;

uniform mat4 u_perspective;
uniform mat4 u_view;
uniform mat4 u_model;

out vec4 vertexcolour;

void main() {
    gl_Position = u_perspective * u_view * a_world * u_model * vec4(a_position, 1.0);
    vertexcolour = vec4(1.0, 0.0, 1.0, 1.0);
}
