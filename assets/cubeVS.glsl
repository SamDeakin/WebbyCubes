#version 300 es

layout(location = 0) in mat4 a_world;
layout(location = 4) in vec3 a_position;

uniform mat4 u_perspective;
uniform mat4 u_view;
uniform mat4 u_model;

out vec4 vertexcolour;

void main() {
    gl_Position = u_perspective * u_view * a_world * u_model * vec4(a_position, 1.0);
    vertexcolour = vec4(1.0, 0.0, 1.0, 1.0);
}
