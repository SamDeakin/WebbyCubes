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

out vec3 vertex_colour;
out vec3 object_normal;
out vec3 object_eye;
out vec3 cubeid;
out float faceid;

void main() {
    mat4 modelview = u_view * a_world * u_model;
    vec4 view_pos = modelview * vec4(a_position, 1.0);
    gl_Position = u_perspective * view_pos;
    vertex_colour = a_colour;
    object_normal = a_normal;

    // We should really do this inverse on cpu, but chances are nvidia/amd/intel can write
    // a faster implementation than I would for this project.
    // Potential optimization if we end up doing this for many types of objects and render passes.
    vec4 view_eye = vec4(view_pos.xyz * -1.0, view_pos.w);
    vec4 object_eye_pos = inverse(modelview) * view_eye;
    object_eye = normalize(object_eye_pos.xyz / object_eye_pos.w);

    cubeid = a_cube;
    faceid = a_face;
}
