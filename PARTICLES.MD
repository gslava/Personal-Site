# Reference Mechanics: `reference/app.js`

This document records the particle animation mechanics implemented in [app.js](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js).

The goal is not to copy the bundle verbatim. The goal is to understand what the reference actually does, so our clean-room implementation can reproduce the same class of behavior.

## What Was Read

`reference/app.js` is a Browserify-style bundle with `54700` lines.

Bundle structure:

- lines `1-12`: module `1`, `glslify` helper
- lines `13-7977`: module `2`, `GSAP / TweenMax`
- lines `7978-53962`: module `3`, `three.js`
- lines `53963-54066`: module `4`, app bootstrap / render loop
- lines `54067-54130`: module `5`, particle render object
- lines `54131-54356`: module `6`, simulation
- lines `54357-54675`: module `7`, `GPUComputationRenderer`
- lines `54676-54700`: module `8`, `ProjectorHelper`

For the particle effect itself, the custom logic is entirely in modules `4-8`. The rest of the file is vendor code.

## Core Conclusion

The reference effect is not a rotating 3D sphere.

It is a `2D GPU particle simulation` rendered on a single plane, with the illusion of spherical depth created by:

- dense additive white points
- a moving monochrome gradient texture
- a curl-noise-driven target field
- local mouse repulsion and deformation
- density differences across the particle cloud

This is the most important correction for our implementation.

The current mistake on our site was treating the effect like a 3D object that should rotate as a whole. The reference does not do that.

## Exact App Pipeline

From [app.js:53963](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:53963):

- `THREE.Scene`
- `THREE.PerspectiveCamera(60, aspect, 0.1, 1000)`
- `camera.position.z = 300`
- `THREE.WebGLRenderer({ alpha: true })`
- `Particles`
- `Simulation`

Configured options:

- `fboSize = getParticlesCount()`
- `radius = 120`

From [app.js:54048](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54048):

- default particle resolution is `512 x 512`
- if `window.innerWidth > 1920`, it becomes `1024 x 1024`
- there is no smaller branch for mobile in the bundle

That means total particle counts are:

- `262,144` particles at `512`
- `1,048,576` particles at `1024`

## Render Loop

From [app.js:54028](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54028):

Each frame:

1. `requestAnimationFrame(render)`
2. `simulation.update(clock.getElapsedTime() * 0.02)`
3. `particles.material.uniforms.positions.value = simulation.getTexture()`
4. `particles.material.uniforms.time.value = clock.getElapsedTime() * 0.5`
5. `renderer.render(scene, camera)`

Important:

- the particle render object is not rotated
- the camera is not animated
- all visible motion comes from the simulation texture and fragment shading

## Particle Render Object

From [app.js:54078](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54078):

`ParticlesGeometry` extends `THREE.Points`.

Geometry:

- creates `width * height` vertices
- each vertex stores:
  - `x = Math.random() * width`
  - `y = Math.random() * height`
  - `z = 0`

Material:

- `THREE.ShaderMaterial`
- `transparent: true`
- `blending: THREE.AdditiveBlending`

Uniforms:

- `gradient`: `images/gradient.jpg`
- `positions`: simulation texture
- `time`
- `pointSize`
- `positionsResolution`
- `colorResolution`
- `windowResolution`

### Vertex Shader Behavior

From [app.js:54101](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54101):

- computes `uv = position.xy / positionsResolution.xy`
- but then samples `texture2D(positions, position.xy)`
- reads `pos.w` into `colored`
- renders every point at:
  - `gl_Position = projectionMatrix * modelViewMatrix * vec4(pos.xy, 1.0, 1.0)`
- hardcodes:
  - `gl_PointSize = 1.0`

Implications:

- every particle is effectively a `1px` point
- there is no 3D depth per particle; `z` is fixed to `1.0`
- the effect is a flat cloud in one plane

Important quirk:

- the shader computes normalized `uv`, but does not use it
- it samples with `position.xy` directly
- this looks wrong in clean GLSL terms and should not be copied literally into our code
- in our clean-room version we should sample with normalized UVs, but preserve the visible behavior

### Fragment Shader Behavior

From [app.js:54101](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54101):

The fragment shader does not shape particles with `gl_PointCoord`.

Instead it:

- samples a moving `gradient.jpg`
- uses screen-space coordinates:
  - `st = gl_FragCoord.xy / colorResolution`
- offsets the gradient lookup with:
  - `x = st.x + (cos(time * 2.) - 1.0) + 0.5`
  - `y = st.y + (sin(time * 2.) - 1.0) + 1.5`
- converts sampled gradient to grayscale
- mixes toward white using `intensity = 1.0 - colored`

Effect:

- most particles are bright white
- particles near strong interaction zones get darker gradient modulation because `colored` rises
- the surface shimmer comes partly from the moving gradient texture, not only from particle motion

## Simulation Architecture

From [app.js:54131](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54131):

Simulation uses:

- `GPUComputationRenderer`
- `FBO_SIZE x FBO_SIZE`
- `RADIUS = options.radius * 1.1`

Given `radius = 120`, actual simulation radius is:

- `132`

State fields:

- `mouse: THREE.Vector3()`
- `screenMouse: THREE.Vector2()`
- `initMouseMove = false`
- `SPEED = 0.1`
- `TIME_SPEED = 0.006`
- `ANIMATING = true`
- `TOTAL = FBO_SIZE * FBO_SIZE`

The simulation creates these textures/variables:

- `initPosTexture`
- `positionsTexture`
- `emptyTexture`
- compute variable `initPos`
- compute variable `velocity`
- compute variable `acceleration`
- compute variable `positions`
- compute variable `oldPosition`
- compute variable `oldVelocity`

## Texture Initialization

From [app.js:54287](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54287):

Initial particle data per texel:

- `x = Math.random() * 2`
- `y = Math.random() * 1`
- `z = 0.2`
- `w = Math.random()`

This matters:

- the seed space is not a sphere
- it is a compact random rectangle in noise-input space
- the final “sphere” is emergent from the simulation field and render density, not from spherical initial geometry

## Variable Dependencies

From [app.js:54278](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54278):

- `oldPosition` depends on `positions`
- `positions` depends on `velocity` and `oldPosition`
- `acceleration` depends on `oldPosition` and `initPos`
- `velocity` depends on `acceleration`, `oldVelocity`, `oldPosition`
- `oldVelocity` depends on `velocity`

This is a ping-pong state machine where each frame copies current values into “old” textures and computes new values from them.

## What Each Variable Actually Stores

### `initPosTexture`

Used as immutable noise seed / particle identity.

Channels:

- `x, y, z`: seed coordinates for curl-noise field
- `w`: random seed, not meaningfully used in the final logic

### `positionsTexture`

From [app.js:54248](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54248):

Stores:

- `x, y`: current particle position in simulation plane
- `z`: always `0.0`
- `w`: interaction color/intensity marker propagated from velocity

### `accelerationTexture`

From [app.js:54212](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54212):

Stores:

- `x, y`: spring acceleration toward current target
- `z`: speed multiplier flag
- `w`: “colored” interaction intensity for rendering

### `velocityTexture`

From [app.js:54197](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54197):

Stores:

- `x, y`: velocity used by positions pass
- `z`: copied from `acceleration.z`
- `w`: copied from `acceleration.w`

## The Real Motion Model

The reference motion comes from `accelerationTexture`.

### Baseline target field

From [app.js:54212](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54212):

Each particle computes:

- `newPos = curlNoise(initPos.xyz + time).xyz * radius`
- `target = newPos`
- `target.z = 0.0`

Important:

- target depends on `initPos`, not on current particle position
- that means each particle has a stable identity in the flow field
- as `time` changes, the whole target field morphs
- particles continuously chase their moving target

This is why the effect feels like living fabric instead of free-floating dust.

### Spring force

Outside mouse influence:

- `dx = target.x - pos.x`
- `dy = target.y - pos.y`
- `ax = dx * spring`
- `ay = dy * spring`

Uniform:

- `spring = 0.3`

So the default behavior is a spring return toward the moving curl-noise target.

### Mouse repulsion

The mouse is projected into the particle plane, not used as raw screen coordinates.

From [app.js:54682](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54682):

`ProjectorHelper`:

- unprojects mouse to world space with camera
- builds ray from camera through cursor
- intersects that ray with plane `z = 0`
- resulting `vOutPos` becomes simulation-space mouse

From [app.js:54322](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54322):

- `Helper.compute(event.clientX, event.clientY, camera, mouse)`
- `mousePos` uniform is set to projected world coordinates
- y is flipped before writing to the shader uniform

### Repulsion radius logic

From [app.js:54338](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54338):

`repulseRadius` is tweened to:

- `RADIUS * 0.3 + RADIUS * 0.2 * (1 - screenMouse.length() / (window.innerWidth / 2))`

Meaning:

- near the screen center, radius is larger
- toward the edges, radius shrinks
- the interaction field is dynamic and screen-position-dependent

### Inside interaction zone

From [app.js:54212](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54212):

If `dist < preyRadius`:

- `preyRadius = repulseRadius + dist / 2.0`
- `force = (distSquared / preyRadiusSq - 1.0) * 100.0`
- `velocity = normalize(dir) * force`

Since `dir = mousePos - pos.xy`, this produces a negative force along the direction to the mouse, which means repulsion away from the mouse.

But that is only one part.

The stronger visual deformation comes from `mouseMotion`:

- compute signed distance around mouse via `sdCapsule`
- turn that into `mouseRatio`
- build:
  - radial outward term from current particle position
  - directional term from `mousePos`
- then:
  - `target.xy += mouseMotion * 10.0`
  - `target.x += velocity.x`
  - `target.y += velocity.y`

This is why the reference does not simply “push particles away”.

It does all of this together:

- repels away from cursor
- drags the local target field
- stretches nearby flow lines
- makes disturbed particles move faster

### Speed boost near the mouse

Inside interaction:

- `target.z = 1.0`

Outside interaction:

- `outside = 0.2`

Then `gl_FragColor = vec4(ax, ay, outside-or-1.0, colored)`.

Later:

- velocity pass copies `acceleration.z` into `velocity.z`
- positions pass advances by:
  - `newPos = currentPosition.xy + velocity.xy * velocity.z`

This means:

- baseline movement multiplier is `0.2`
- disturbed particles jump to `1.0`

That is a huge part of the “interesting physics”.

The mouse does not rotate the cloud.
It changes both force direction and per-particle step size.

### Render coloring near the mouse

Still inside acceleration shader:

- when `dist < preyRadius * 0.8`
- `colored` rises from `0.0` to `1.0`

That value becomes:

- `acceleration.w`
- then `velocity.w`
- then `positions.w`
- then render shader uniform `colored`

Render shader uses:

- `intensity = 1.0 - colored`

So stronger interaction means less white override and more visible gradient shading.

This is why the disturbed area visually changes tone as well as motion.

## Important Quirks In The Source

These are real details in the bundle and matter for reproduction quality.

### 1. The sphere is not rotated

There is no whole-object rotation in the reference app.

If our implementation rotates the entire mesh or field in response to mouse movement, it is wrong.

### 2. The simulation is 2D

- render uses `vec4(pos.xy, 1.0, 1.0)`
- positions pass writes `z = 0.0`

So the reference is fundamentally a 2D plane simulation with a spherical illusion.

### 3. Velocity pass appears to contain a bug

From [app.js:54197](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54197):

It does:

- `oldVelocity = texture2D(accelerationTexture, uv);`

instead of sampling `oldVelocityTexture`.

That means the code is not integrating previous velocity in the normal way.

Literal effect:

- velocity behaves more like damped current acceleration than classic accumulated inertia

This oddity may contribute to the reference feel.

### 4. Several values are stored but not meaningfully used

Examples:

- `delay` in acceleration shader
- `oldMousePos` uniform
- `pointSize` uniform
- `radius` uniform in velocity shader
- some helper variables like `diff`, `angle`, `lMouse`

The reference code is not mathematically clean. It is “worked until it looked right” code.

### 5. Render sampling code has a suspicious lookup

The vertex shader computes normalized UVs, but samples with `position.xy`.

In a clean implementation we should not repeat that literally.
We should preserve the look, not the apparent bug.

## What Must Be Preserved In Our Clean-Room Version

If we want our sphere to feel like the reference, these are the non-negotiables:

1. Fixed camera and no whole-field rotation from mouse movement.

2. 2D particle simulation on one plane, not a 3D rotating object.

3. Large particle count.

Reference class:

- at least `512 x 512`

4. Stable per-particle identity field from `curlNoise(seed + time)`.

5. Spring return to moving target, not free movement.

6. Mouse interaction must:

- repel locally
- distort the target field
- increase local movement speed
- change rendering intensity near the cursor

7. Additive white rendering with very small points.

8. Separate visual brightness modulation layer.

Reference uses:

- `gradient.jpg`
- screen-space animated grayscale lookup

9. Particle motion should feel like local tearing and re-weaving, not like the whole sphere is spinning.

## Recommended Clean-Room Recreation Plan

### Simulation

Implement these GPU textures:

- `seedTexture`
- `positionTexture`
- `velocityTexture`
- optional `interactionTexture` or pack interaction into velocity alpha

Recommended packed channels:

- `position.xy = current position`
- `velocity.xy = current velocity`
- `velocity.z = speed multiplier`
- `velocity.w = interaction intensity`

Use:

- `target = curlNoise(seed.xyz + time) * radius`
- `acceleration = (target - position) * spring`

Then add mouse deformation:

- repulsion away from projected mouse point
- target drag term like reference `mouseMotion`
- larger speed multiplier near cursor

### Rendering

Do not rotate the particle object.

Render with:

- `THREE.Points`
- `AdditiveBlending`
- `gl_PointSize` near `1px`
- grayscale white output
- optional animated gradient texture or procedural grayscale field

### Interaction

Project cursor into simulation plane exactly like the reference:

- camera ray
- intersection with `z = 0`

Do not use simple normalized screen coordinates as the final particle-force point.

## Practical Checklist For Reimplementation

- camera fixed at roughly `fov 60`, `z 300`
- field lives on plane `z = 0`
- no mouse-driven object rotation
- dense additive point render
- FBO simulation at `512`
- curl-noise target from immutable seeds
- spring pull to target
- dynamic repulsion radius
- local speed multiplier jump near mouse
- local render intensity modulation near mouse
- optional moving gradient texture for shimmer

## Final Implementation Insight

The beauty of the reference is not one trick.

It is the combination of:

- `curl-noise target field`
- `spring pursuit`
- `mouse-driven target distortion`
- `local speed amplification`
- `screen-space brightness modulation`
- `dense additive point rendering`

If we only copy the silhouette, or only rotate a 3D object, it will look wrong.
If we preserve this interaction model, we can get into the same visual family.
