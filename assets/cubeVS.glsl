#version 300 es

layout(location = 0) in mat4 a_world;
layout(location = 4) in vec3 a_position;
layout(location = 5) in vec3 a_cube;
layout(location = 6) in float a_face;


uniform mat4 u_perspective;
uniform mat4 u_view;
uniform mat4 u_model;

out vec4 vertexcolour;
out vec3 cubeid;
out float faceid;

void main() {
    gl_Position = u_perspective * u_view * a_world * u_model * vec4(a_position, 1.0);
    vertexcolour = vec4(1.0, 0.0, 1.0, 1.0);
    cubeid = a_cube;
    faceid = a_face;
}
