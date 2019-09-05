#version 300 es

precision highp float;

in vec4 vertexcolour;
in vec3 cubeid;
in float faceid;

layout(location = 0) out vec4 fragcolour;
layout(location = 1) out vec4 id;

void main() {
    fragcolour = vertexcolour;
    id = vec4(cubeid, faceid);
    fragcolour = vec4(cubeid.y, cubeid.z, faceid * 255.0/6.0, 1.0);
}
