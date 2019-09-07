#version 300 es

precision highp float;

in vec3 vertex_colour;
in vec3 object_normal;
in vec3 object_eye;
in vec3 cubeid;
in float faceid;

layout(location = 0) out vec4 fragcolour;
layout(location = 1) out vec4 id;

// Our sun doesn't have any colour bias.
// Let the user colour dominate the shading
vec3 sun = normalize(vec3(0.5, 0.5, 0.5));

void main() {
    // Set the ambient colour to be brighter for more perpendicular surfaces
    // (With a min of half brightness for a parallel surface)
    // Our phong shading is modified this way because I dislike the look of 
    // simple flat ambient lighting.
    float eye_dot_normal = dot(object_eye, object_normal);
    vec3 ambient = vertex_colour * (eye_dot_normal * 0.5 + 0.5);

    float normal_dot_sun = dot(object_normal, sun);
    vec3 diffuse = vertex_colour * normal_dot_sun;
    diffuse = max(diffuse, 0.0); // Diffuse lighting cannot "subtract" from the total

    fragcolour = vec4(ambient * 0.5 + diffuse * 0.5, 1.0);
    id = vec4(cubeid, faceid);
}
