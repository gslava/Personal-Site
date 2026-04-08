import { buildCurlNoiseShader } from './particle-sphere.shaders';
import { createDataTexture, createEmptyTexture, createInitialData } from './particle-sphere.textures';
import {
  GpuComputationRendererInstance,
  SimulationVariables,
  ThreeModule,
} from './particle-sphere.types';

export function createSimulation(
  THREE: ThreeModule,
  gpuCompute: GpuComputationRendererInstance,
  fboSize: number,
  simulationRadius: number,
  windowRef: Window,
): SimulationVariables {
  const initialData = createInitialData(fboSize);
  const seedTexture = createDataTexture(THREE, fboSize, initialData);
  const positionTexture = createDataTexture(THREE, fboSize, initialData);
  const emptyTexture = createEmptyTexture(THREE, fboSize);

  const initPos = gpuCompute.addVariable(
    'initPosTexture',
    `
      uniform sampler2D positions;
      uniform vec2 positionsResolution;

      void main() {
        vec2 uv = gl_FragCoord.xy / positionsResolution.xy;
        vec4 pos = texture2D(positions, uv);
        gl_FragColor = vec4(pos.xy, 0.0, 1.0);
      }
    `,
    seedTexture,
  );
  initPos.wrapS = THREE.RepeatWrapping;
  initPos.wrapT = THREE.RepeatWrapping;
  initPos.material.uniforms['positions'] = { value: seedTexture };
  initPos.material.uniforms['positionsResolution'] = { value: new THREE.Vector2(fboSize, fboSize) };

  const velocity = gpuCompute.addVariable(
    'velocityTexture',
    `
      uniform vec2 positionsResolution;
      uniform float friction;

      void main() {
        vec2 uv = gl_FragCoord.xy / positionsResolution.xy;
        // The reference bundle samples the acceleration texture here.
        vec4 oldVelocity = texture2D(accelerationTexture, uv);
        vec4 acceleration = texture2D(accelerationTexture, uv);
        vec3 velocityValue = vec3(0.0);

        velocityValue.z = acceleration.z;
        velocityValue.x = oldVelocity.x + acceleration.x;
        velocityValue.y = oldVelocity.y + acceleration.y;
        velocityValue *= friction;

        gl_FragColor = vec4(vec3(velocityValue), acceleration.w);
      }
    `,
    emptyTexture,
  );
  velocity.wrapS = THREE.RepeatWrapping;
  velocity.wrapT = THREE.RepeatWrapping;
  velocity.material.uniforms['positionsResolution'] = { value: new THREE.Vector2(fboSize, fboSize) };
  velocity.material.uniforms['friction'] = { value: 0.99 };

  const acceleration = gpuCompute.addVariable(
    'accelerationTexture',
    `
      ${buildCurlNoiseShader()}

      uniform float speed;
      uniform float spring;
      uniform float radius;
      uniform float friction;
      uniform float time;
      uniform float delta;
      uniform vec2 mousePos;
      uniform vec2 oldMousePos;
      uniform vec2 positionsResolution;
      uniform vec2 uWindowResolution;
      uniform float repulseRadius;

      float sdCapsule(vec2 point, vec2 start, vec2 end, float capsuleRadius) {
        vec2 pa = point - start;
        vec2 ba = end - start;
        float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
        return length(pa - ba * h) - capsuleRadius;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / positionsResolution.xy;
        vec4 initPos = texture2D(initPosTexture, uv);
        vec4 pos = texture2D(oldPositionTexture, uv);
        vec2 mouseUV = mousePos.xy / positionsResolution.xy;

        vec3 newPos = curlNoise(initPos.xyz + time).xyz * radius;
        vec3 target = newPos;

        float dx;
        float dy;
        float angle = atan(mouseUV.y - 0.5, mouseUV.x - 0.5);
        angle = abs(angle);
        vec2 dir = mousePos - pos.xy;
        float dist = length(dir);
        float distSquared = dist * dist;
        float preyRadius = repulseRadius + dist / 2.0;
        float preyRadiusSq = preyRadius * preyRadius;
        float colored = 0.0;
        float outside = 0.2;

        target.z = 0.0;
        dx = target.x - pos.x;
        dy = target.y - pos.y;

        if (dist < preyRadius) {
          float force = (distSquared / preyRadiusSq - 1.0) * 100.0;
          vec2 normDir = normalize(dir);
          vec2 repulseVelocity = normDir * force;
          vec2 mouseXY = pos.xy;
          float d = sdCapsule(mouseXY, mousePos.xy, mousePos.xy, preyRadius);
          float mouseRatio = (1.0 - smoothstep(-preyRadius * 4.0, 2.0, d)) * 0.5;
          vec2 mouseMotion = normalize(mouseXY + vec2(step(0.0001, -length(mouseXY)))) * mouseRatio * 10.0;
          mouseMotion += mousePos.xy * mouseRatio;

          target.xy += mouseMotion * 10.0;
          target.x += repulseVelocity.x;
          target.y += repulseVelocity.y;
          target.z = 1.0;

          dx = target.x - pos.x;
          dy = target.y - pos.y;
        }

        float ax = dx * spring;
        float ay = dy * spring;

        if (dist < preyRadius * 0.8) {
          float minDist = max(preyRadius * 0.6, dist);
          colored = 1.0 - ((minDist - (preyRadius * 0.6)) / ((preyRadius * 0.8) - (preyRadius * 0.6)));
        }

        gl_FragColor = vec4(vec2(ax, ay), outside, colored);
      }
    `,
    emptyTexture,
  );
  acceleration.wrapS = THREE.RepeatWrapping;
  acceleration.wrapT = THREE.RepeatWrapping;
  acceleration.material.uniforms['time'] = { value: 0 };
  acceleration.material.uniforms['delta'] = { value: 0 };
  acceleration.material.uniforms['repulseRadius'] = { value: simulationRadius * 0.3 };
  acceleration.material.uniforms['mousePos'] = { value: new THREE.Vector2(windowRef.innerWidth, 0) };
  acceleration.material.uniforms['oldMousePos'] = { value: new THREE.Vector2(windowRef.innerWidth, 0) };
  acceleration.material.uniforms['spring'] = { value: 0.3 };
  acceleration.material.uniforms['positionsResolution'] = { value: new THREE.Vector2(fboSize, fboSize) };
  acceleration.material.uniforms['uWindowResolution'] = {
    value: new THREE.Vector2(windowRef.innerWidth, windowRef.innerHeight),
  };
  acceleration.material.uniforms['speed'] = { value: 0.05 };
  acceleration.material.uniforms['friction'] = { value: 0.99 };
  acceleration.material.uniforms['radius'] = { value: 0 };

  const positions = gpuCompute.addVariable(
    'positionsTexture',
    `
      uniform sampler2D positions;
      uniform vec2 positionsResolution;

      void main() {
        vec2 uv = gl_FragCoord.xy / positionsResolution.xy;
        vec4 currentPosition = texture2D(oldPositionTexture, uv);
        vec4 velocity = texture2D(velocityTexture, uv);
        vec2 newPos = currentPosition.xy + (velocity.xy * velocity.z);

        gl_FragColor = vec4(vec3(newPos.xy, 0.0), velocity.w);
      }
    `,
    positionTexture,
  );
  positions.wrapS = THREE.RepeatWrapping;
  positions.wrapT = THREE.RepeatWrapping;
  positions.material.uniforms['positions'] = { value: positionTexture };
  positions.material.uniforms['positionsResolution'] = { value: new THREE.Vector2(fboSize, fboSize) };

  const oldPosition = gpuCompute.addVariable(
    'oldPositionTexture',
    `
      uniform vec2 positionsResolution;

      void main() {
        vec2 uv = gl_FragCoord.xy / positionsResolution.xy;
        vec2 newValue = texture2D(positionsTexture, uv).xy;
        gl_FragColor = vec4(vec2(newValue), 0.0, 0.0);
      }
    `,
    positionTexture,
  );
  oldPosition.wrapS = THREE.RepeatWrapping;
  oldPosition.wrapT = THREE.RepeatWrapping;
  oldPosition.material.uniforms['positionsResolution'] = { value: new THREE.Vector2(fboSize, fboSize) };

  const oldVelocity = gpuCompute.addVariable(
    'oldVelocityTexture',
    `
      uniform vec2 positionsResolution;

      void main() {
        vec2 uv = gl_FragCoord.xy / positionsResolution.xy;
        vec3 newValue = texture2D(velocityTexture, uv).xyz;
        gl_FragColor = vec4(vec3(newValue), 0.0);
      }
    `,
    emptyTexture,
  );
  oldVelocity.wrapS = THREE.RepeatWrapping;
  oldVelocity.wrapT = THREE.RepeatWrapping;
  oldVelocity.material.uniforms['positionsResolution'] = { value: new THREE.Vector2(fboSize, fboSize) };

  gpuCompute.setVariableDependencies(oldPosition, [positions]);
  gpuCompute.setVariableDependencies(positions, [velocity, oldPosition]);
  gpuCompute.setVariableDependencies(acceleration, [oldPosition, initPos]);
  gpuCompute.setVariableDependencies(velocity, [acceleration, oldVelocity, oldPosition]);
  gpuCompute.setVariableDependencies(oldVelocity, [velocity]);

  const error = gpuCompute.init();

  if (error) {
    throw new Error(error);
  }

  return {
    initPos,
    acceleration,
    velocity,
    positions,
    oldPosition,
    oldVelocity,
  };
}
