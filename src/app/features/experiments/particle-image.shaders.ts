export const IMAGE_PARTICLE_VERTEX = `
attribute vec2 center;
attribute float tone;
attribute float seed;
uniform sampler2D trail;
uniform float clock;
uniform float reveal;
uniform float motion;
uniform float sampleStep;
varying vec2 disc;
varying float brightness;
void main() {
  disc = uv;
  brightness = tone;
  float field = texture2D(trail, center * .5 + .5).r;
  float angle = seed * 37.7;
  vec2 direction = vec2(cos(angle), sin(angle));
  float drift = sin(clock * .75 + seed * 28.0) * motion;
  float spread = (1.0 - reveal);
  vec3 location = vec3(center, 0.0);
  location.xy += (vec2(fract(seed * 37.0), fract(seed * 91.0)) - .5) * sampleStep * .85;
  location.xy += direction * (field * (.12 + seed * .18) + spread * .65);
  location.xy += direction * drift * .0015;
  location.z += field * (.15 + seed * .4) + spread * seed * .8 + drift * .012;
  float size = sampleStep * (.5 + tone * 1.45) * (.95 + drift * .08);
  location.xy += position.xy * size * reveal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(location, 1.0);
}
`;
export const IMAGE_PARTICLE_FRAGMENT = `
varying vec2 disc;
varying float brightness;
void main() {
  float radius = length(disc - .5);
  float coverage = 1.0 - smoothstep(.25, .5, radius);
  if (coverage < .01) discard;
  gl_FragColor = vec4(vec3(pow(brightness, .7)), coverage);
}
`;
