export type ThreeModule = typeof import('three');
export type GpuComputationModule = typeof import('three/examples/jsm/misc/GPUComputationRenderer.js');
export type GpuComputationRendererClass = GpuComputationModule['GPUComputationRenderer'];
export type GpuComputationRendererInstance = InstanceType<GpuComputationRendererClass>;
export type ComputeVariable = ReturnType<GpuComputationRendererInstance['addVariable']>;

export type SimulationVariables = {
  initPos: ComputeVariable;
  acceleration: ComputeVariable;
  velocity: ComputeVariable;
  positions: ComputeVariable;
  oldPosition: ComputeVariable;
  oldVelocity: ComputeVariable;
};

export type VectorTween = {
  active: boolean;
  startMs: number;
  durationMs: number;
  from: import('three').Vector2;
  to: import('three').Vector2;
};

export type ScalarTween = {
  active: boolean;
  startMs: number;
  durationMs: number;
  from: number;
  to: number;
};

export type ParticlePoints = {
  geometry: import('three').BufferGeometry;
  material: import('three').ShaderMaterial;
  points: import('three').Points;
  gradient: import('three').Texture;
};
