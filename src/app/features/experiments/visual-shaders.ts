import type { CinematicScene } from './cinematic-shaders';
export type VisualScene = CinematicScene;
export const VERTEX_SHADER = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0., 1.); }
`;
