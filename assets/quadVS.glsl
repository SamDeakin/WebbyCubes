#version 300 es

layout(location = 0) in vec3 a_position;
layout(location = 1) in vec2 a_uv;

out vec2 texuv;

void main() {
    gl_Position = vec4(a_position, 1.0);
    texuv = a_uv;
}
