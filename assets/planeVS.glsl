#version 300 es

layout(location = 0) in vec3 a_position;

uniform mat4 u_perspective;
uniform mat4 u_view;
uniform mat4 u_view_inverse;

out vec2 world_position;
out vec3 object_eye;

// Extra data used to "supersample" the grid without actually supersampling
out vec3 plane_point;
out vec3 plane_normal;
out vec3 line_point2; // 1 is calculated in the FS
out vec4 camera_point;

void main() {
    vec4 view_pos = u_view * vec4(a_position, 1.0);
    gl_Position = u_perspective * view_pos;
    world_position = a_position.xz;

    vec4 view_eye_dir = vec4(view_pos.xyz * -1.0 / view_pos.w, 0.0);
    object_eye = normalize((u_view_inverse * view_eye_dir).xyz);

    camera_point = gl_Position;
    vec4 view_eye_point = vec4(view_eye_dir.xyz, 1.0);
    vec4 object_eye_point = u_view_inverse * view_eye_point;
    line_point2 = object_eye_point.xyz / object_eye_point.w;

    // Algebraic equation of a plane
    plane_point = a_position;
    plane_normal = vec3(0.0, 1.0, 0.0);
}
