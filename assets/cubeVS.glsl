attribute vec3 a_position;

uniform mat4 u_projection;
uniform mat4 u_world;
uniform mat4 u_model;

void main() {
    gl_Position = u_projection * u_world * u_model * vec4(a_position, 1.0);
}
