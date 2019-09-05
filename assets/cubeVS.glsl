#version 300 es

layout(location = 0) in mat4 a_world;
layout(location = 4) in vec3 a_position;
layout(location = 5) in vec3 a_cube;
layout(location = 6) in float a_face;
layout(location = 7) in vec3 a_colour;
layout(location = 8) in vec3 a_normal;


uniform mat4 u_perspective;
uniform mat4 u_view;
uniform mat4 u_model;

out vec4 vertexcolour;
out vec4 vertexnormal;
out vec3 cubeid;
out float faceid;

void main() {
    gl_Position = u_perspective * u_view * a_world * u_model * vec4(a_position, 1.0);
    vertexcolour = vec4(a_colour, 1.0);
    vertexnormal = vec4(a_normal, 1.0);
    cubeid = a_cube;
    faceid = a_face;
}
