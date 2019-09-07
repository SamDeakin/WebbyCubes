#version 300 es

precision highp float;

in vec3 vertex_colour;
in vec3 object_normal;
in vec3 object_eye;
in vec3 cubeid;
in float faceid;

layout(location = 0) out vec4 fragcolour;
layout(location = 1) out vec4 id;

vec3 sun = normalize(vec3(0.5, 0.5, 0.5));

void main() {
    sun = normalize(sun);

    float eye_dot_normal = dot(object_eye.xyz, object_normal);

    // Set the ambient colour to be brighter for more perpendicular surfaces
    // (With a min of half brightness for a parallel surface)
    vec3 ambient = vertex_colour * (eye_dot_normal * 0.5 + 0.5);

    fragcolour = vec4(ambient, 1.0);
    fragcolour = vec4(object_eye.xyz, 1.0);
    id = vec4(cubeid, faceid);
}
