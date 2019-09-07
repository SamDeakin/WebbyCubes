#version 300 es

precision highp float;

in vec3 vertex_colour;
in vec3 object_normal;
in vec4 object_eye;
in vec3 cubeid;
in float faceid;

layout(location = 0) out vec4 fragcolour;
layout(location = 1) out vec4 id;

vec3 sun = normalize(vec3(0.5, 0.5, 0.5));

void main() {
    sun = normalize(sun);
    vec3 eye_direction = normalize(object_eye.xyz);

    float eye_to_normal = dot(eye_direction, object_normal);

    vec3 ambient = vertex_colour * eye_to_normal;

    fragcolour = vec4(vertex_colour * 0.3 + ambient * 0.7, 1.0);
    id = vec4(cubeid, faceid);
}
