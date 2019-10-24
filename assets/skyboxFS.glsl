#version 300 es

precision highp float;

layout(location = 0) out vec4 fragcolour;
layout(location = 1) out vec4 id;

in vec3 world_direction;

float PI = 3.1415926535897932384626;
float PI_BY_2 = 1.57079632679489661;
float PI_BY_3 = 1.04719755119659774;
float ONE_THIRD = 1.0 / 3.0;

vec3 colour_up = vec3(145.0, 91.0, 161.0) / 255.0;
float up_threshold = 1.0;
float down_threshold = -1.0;
vec3 colour_down = vec3(237.0, 51.0, 28.0) / 255.0;

vec3 rgb_lerp(vec3 colour1, vec3 colour2, float lerp) {
    return mix(colour1, colour2, lerp);
}

vec3 rgb_to_hcl(vec3 rgb) {
    // https://en.wikipedia.org/wiki/HCL_color_space
    float maxrgb = max(max(rgb.r, rgb.g), rgb.b);
    float minrgb = min(min(rgb.r, rgb.g), rgb.b);
    float alpha = 0.01 * minrgb / maxrgb;
    float gamma = 3.0;
    float Q = exp(gamma * alpha); // A correction factor

    vec3 hcl = vec3(0.0);

    // Luminance
    hcl.z = (Q * maxrgb + (1.0 - Q) * minrgb) * 0.5;

    // Chroma
    hcl.y = (Q * (abs(rgb.r - rgb.g) + abs(rgb.g - rgb.b) + abs(rgb.b - rgb.r))) * ONE_THIRD;

    // Hue
    hcl.x = atan(rgb.g - rgb.b, rgb.r - rgb.g);

    return hcl;
}

//
vec3 hcl_to_rgb(vec3 hcl) {
    // Algorithm from:
    // HCL: a new Color Space for a more Effective Content-based Image Retrieval
    // M. Sarifuddin and Rokia Missaoui (2005)
    vec3 rgb = vec3(0.0);

    float h = hcl.x;
    float c = hcl.y;
    float l = hcl.z;

    float gamma = 3.0;
    float one_over_y0 = 0.01;
    float Q = exp(gamma * one_over_y0 * (1.0 - ((3.0 * c) / (4.0 * l))));
    float minval = ((4.0 * c) - (3.0 * c)) / ((4.0 * Q) - 2.0);
    float maxval = minval + (3.0 * c) / (2.0 * Q);

    if (0.0 <= h && h <= PI_BY_3) {
        rgb.r = maxval;
        rgb.b = minval;

        float tan_hue = tan(1.5 * h);
        rgb.g = (rgb.r * tan_hue + rgb.b) / (1.0 + tan_hue);
    } else if (PI_BY_3 < h && h <= 2.0 * PI_BY_3) {
        rgb.g = maxval;
        rgb.b = minval;

        float tan_hue = tan(0.75 * (h - PI));
        rgb.r = (rgb.g * (1.0 + tan_hue) - rgb.b) / tan_hue;
    } else if (2.0 * PI_BY_3 < h && h <= PI) {
        rgb.r = minval;
        rgb.g = maxval;

        float tan_hue = tan(0.75 * (h - PI));
        rgb.b = rgb.g * (1.0 + tan_hue) - rgb.r * tan_hue;
    } else if (-PI_BY_3 <= h && h < 0.0) {
        rgb.r = maxval;
        rgb.g = minval;

        float tan_hue = tan(0.75 * h);
        rgb.b = rgb.g * (1.0 + tan_hue) - rgb.r * tan_hue;
    } else if (-2.0 * PI_BY_3 <= h && h < -PI_BY_3) {
        rgb.g = minval;
        rgb.b = maxval;

        float tan_hue = tan(0.75 * h);
        rgb.r = (rgb.g * (1.0 + tan_hue) - rgb.b) / tan_hue;
    } else if (-PI < h && h < -2.0 * PI_BY_3) {
        rgb.r = minval;
        rgb.b = maxval;

        float tan_hue = tan(1.5 * (h + PI));
        rgb.g = (rgb.r * tan_hue + rgb.b) / (1.0 + tan_hue);
    }

    return rgb;
}

// This lerp in HCL colour space is much more expensive than a lerp in RGB, but it
// gives much better visual results than its RGB counterpart, which can often produce
// awkward intermediate colours.
vec3 hcl_lerp(vec3 colour1, vec3 colour2, float lerp) {
    // First translate to HCL colour space
    vec3 hcl1 = rgb_to_hcl(colour1);
    vec3 hcl2 = rgb_to_hcl(colour2);

    vec3 hcl_lerped = mix(hcl1, hcl2, lerp);
    return hcl_to_rgb(hcl_lerped);
}

void main() {
    // We compute the rise above the horizon
    vec3 horizon_plane_normal = vec3(0.0, 1.0, 0.0);
    float sky_dot_horizon = dot(normalize(world_direction), horizon_plane_normal);
    float vertical_angle = asin(sky_dot_horizon);

    float colour_lerp = (vertical_angle / PI_BY_2 - down_threshold) / (up_threshold - down_threshold);
    vec3 colour = hcl_lerp(colour_down, colour_up, colour_lerp);
    fragcolour = vec4(colour, 1.0);

    // The skybox is always behind everything else
    gl_FragDepth = 1.0;
    // Set a special no-placement value representing the skybox
    id = vec4(vec3(0.0), 254.0 / 255.0);
}
