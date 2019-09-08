#version 300 es

precision highp float;

in vec3 vertex_colour;
in vec3 object_normal;
in vec3 object_eye;
in vec3 object_sun;
in vec3 cubeid;
in float faceid;

layout(location = 0) out vec4 fragcolour;
layout(location = 1) out vec4 id;

void main() {
    // Set the ambient colour to be brighter for more perpendicular surfaces
    // (With a min of half brightness for a parallel surface)
    // Our phong shading is modified this way because I dislike the look of 
    // simple flat ambient lighting.
    float eye_dot_normal = dot(object_eye, object_normal);
    vec3 ambient = vertex_colour * (eye_dot_normal * 0.5 + 0.5);

    float sun_dot_normal = dot(object_sun, object_normal);
    vec3 diffuse = vertex_colour * sun_dot_normal;
    // Diffuse lighting cannot "subtract" from the total, like when facing away.
    diffuse = max(diffuse, 0.0);

    // Calculate the reflection vector from the sun
    // These maxs prevent reflections on the back side of objects towards the sun.
    vec3 reflection = 2.0 * max(sun_dot_normal, 0.0) * object_normal - object_sun;
    reflection = max(reflection, 0.0);
    float reflection_dot_eye = max(dot(reflection, object_eye), 0.0);
    vec3 specular = vertex_colour * reflection_dot_eye;

    fragcolour = vec4(ambient * 0.1 + diffuse * 0.5 + specular * 0.4, 1.0);

    id = vec4(cubeid, faceid);
}
