# Mouse Interaction Mechanics In `reference/app.js`

This document isolates only the particle-to-mouse interaction from [reference/app.js](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js).

The goal is to capture exactly how the reference reacts to the cursor, including the parts that look accidental or mathematically awkward but still affect the final feel.

## What Was Read

The mouse interaction is implemented across these parts of the bundle:

- [reference/app.js:54131](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54131) to [reference/app.js:54356](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54356): `Simulation`
- [reference/app.js:54312](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54312) to [reference/app.js:54355](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54355): event handler and update loop
- [reference/app.js:54197](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54197) to [reference/app.js:54248](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54248): velocity, acceleration, and positions passes
- [reference/app.js:54676](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54676) to [reference/app.js:54700](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54700): `ProjectorHelper`

## High-Level Conclusion

The reference does not rotate a sphere around its axis in response to the mouse.

The cursor interaction works like this:

1. The raw cursor position is projected from screen space into world space on the plane `z = 0`.
2. That projected point is smoothed on the JS side with `TweenMax`.
3. A screen-space distance from viewport center is tracked separately.
4. The shader uses the projected mouse point to distort the local target field.
5. The size of the disturbed zone depends on the screen-space cursor position.
6. The disturbed region also changes its render intensity.
7. The overall animation speed after the intro depends on the same `screenMouse` vector.

This means the interaction is not a single repulsion force. It is a combination of:

- world-space projection
- smoothing
- repulsion
- local field dragging
- radius scaling
- global time-speed modulation
- render intensity modulation

## JS-Side Mouse Pipeline

### 1. Event Source

From [reference/app.js:54312](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54312):

```js
document.body.addEventListener('mousemove', this.mouseMove.bind(this));
```

Important implications:

- the event is bound to `document.body`, not to the canvas
- there is no `mouseleave` reset path
- the last mouse state simply remains active when movement stops

This is important because the reference interaction is not scoped to a component box. It assumes a full-page scene.

### 2. Previous Mouse Position Is Stored But Not Used

At the start of `mouseMove`:

```js
this.acceleration.material.uniforms.oldMousePos.value.x = this.mouse.x;
this.acceleration.material.uniforms.oldMousePos.value.y = -this.mouse.y;
```

Then a new projected mouse position is computed.

Important finding:

- `oldMousePos` is written every move
- but the acceleration shader never actually uses it

So it looks like a leftover uniform from an earlier interaction design.

### 3. Cursor Projection To The Simulation Plane

From [reference/app.js:54682](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54682):

```js
vPos.set(
  -1.0 + 2.0 * nMouseX / window.innerWidth,
  -1.0 + 2.0 * nMouseY / window.innerHeight,
  0.5
).unproject(Camera);

vDir.copy(vPos).sub(Camera.position).normalize();
var flDistance = -Camera.position.z / vDir.z;
vOutPos.copy(Camera.position).add(vDir.multiplyScalar(flDistance));
```

Meaning:

- mouse screen coordinates are converted to NDC
- then unprojected through the perspective camera
- then turned into a ray
- then intersected with plane `z = 0`

This projected point becomes the interaction point for the simulation.

This is one of the most important facts in the whole reference:

- the shader is not reacting to raw pixels
- it is reacting to a world-space point on the same plane where the particles live

### 4. Y Axis Is Flipped Before Sending To The Shader

After projection:

```js
this.acceleration.material.uniforms.mousePos.value.x = this.mouse.x;
this.acceleration.material.uniforms.mousePos.value.y = -this.mouse.y;
```

So the shader receives:

- `mousePos.x = projectedMouse.x`
- `mousePos.y = -projectedMouse.y`

That sign flip matters. If it is missing, the disturbed region mirrors vertically and the interaction feels wrong immediately.

### 5. First Move Snaps, Later Moves Tween

From [reference/app.js:54330](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54330):

```js
if (!this.initMouseMove) {
  this.acceleration.material.uniforms.mousePos.value.x = this.mouse.x;
  this.acceleration.material.uniforms.mousePos.value.y = -this.mouse.y;
  this.initMouseMove = true;
} else {
  TweenMax.to(this.acceleration.material.uniforms.mousePos.value, 0.5, {
    x: this.mouse.x,
    y: -this.mouse.y
  });
}
```

Important behavior:

- first pointer move jumps directly to the projected point
- all later moves are smoothed over `0.5s`

This smoothing is not implemented in the shader. It is done on the JS side.

That means the reference interaction has built-in latency and softness even before the GPU logic starts.

## Screen-Space State That Also Affects Interaction

### 6. `screenMouse` Is Separate From `mousePos`

In `mouseMove`:

```js
this.screenMouse.x = Math.abs(event.clientX - window.innerWidth / 2);
this.screenMouse.y = Math.abs(event.clientY - window.innerHeight / 2);
```

This vector is purely screen-space:

- it measures absolute distance from the viewport center
- it is not projected into world space

The reference uses both:

- `mousePos`: world-space interaction point on the particle plane
- `screenMouse`: screen-space distance-from-center control signal

This split is essential.

### 7. `repulseRadius` Depends On Cursor Position In The Viewport

From [reference/app.js:54338](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54338):

```js
TweenMax.to(this.acceleration.material.uniforms.repulseRadius, 0.5, {
  value: this.RADIUS * 0.3 +
    this.RADIUS * 0.2 *
    (1 - this.screenMouse.length() / (window.innerWidth / 2))
});
```

This means:

- near the viewport center, the disturbed zone grows
- toward the edges, the disturbed zone shrinks
- the transition is smoothed over `0.5s`

Important numeric range:

- base minimum is `RADIUS * 0.3`
- maximum added size is `RADIUS * 0.2`

With `RADIUS = 132`, that is roughly:

- base `39.6`
- near-center max around `66`

So the reference does not use a fixed mouse radius.

### 8. `screenMouse` Also Changes Global Motion Speed

From [reference/app.js:54347](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54347):

```js
this.acceleration.material.uniforms.time.value +=
  this.TIME_SPEED *
  (0.3 * Math.min(0.3, 1 - this.screenMouse.length() / this.H_W));
```

Where:

- `TIME_SPEED = 0.006`
- `H_W = window.innerWidth / 2`

Important consequence:

- moving the cursor changes not only the disturbed local zone
- it also changes the rate at which the whole curl-noise field advances

Near the center:

- `screenMouse.length()` is small
- the multiplier clamps to `0.3`
- effective increment becomes `0.006 * 0.09 = 0.00054`

Near edges:

- the multiplier gets smaller

Near corners:

- `screenMouse.length()` can exceed `window.innerWidth / 2`
- so `1 - screenMouse.length() / this.H_W` can become negative
- therefore the time increment can become negative

This is a very important quirk.

The reference can locally feel as if motion slows or even partially reverses when the cursor is far from center.

## Shader-Side Mouse Logic

All direct particle interaction happens in the acceleration pass.

### 9. The Shader Uses Current Position, Not Seed Position, For Mouse Distance

Core values in the shader:

```glsl
vec4 initPos = texture2D(initPosTexture, uv);
vec4 pos = texture2D(oldPositionTexture, uv);
vec3 newPos = curlNoise(initPos.xyz + time).xyz * radius;
vec3 target = newPos;
vec2 dir = mousePos - pos.xy;
float dist = length(dir);
```

Interpretation:

- each particle has a stable target from `curlNoise(seed + time)`
- the mouse does not replace that target
- instead it deforms the local target for particles whose current position is near the cursor

That is why the field “tears” and then re-weaves, instead of behaving like free particles.

### 10. Effective Interaction Range Is Larger Than `repulseRadius`

The shader computes:

```glsl
float preyRadius = repulseRadius + dist / 2.0;
```

and then checks:

```glsl
if (dist < preyRadius) { ... }
```

This is unusual because `preyRadius` itself depends on `dist`.

If you solve the condition:

- `dist < repulseRadius + dist / 2`
- `dist / 2 < repulseRadius`
- `dist < 2 * repulseRadius`

So the disturbed zone effectively reaches about twice the base radius.

This is a big reason why the field responds over a wider area than a naive radial falloff would suggest.

### 11. Repulsion Force Formula

Inside the disturbed zone:

```glsl
f = (distSquared / preyRadiusSq - 1.0) * 100.0;
vec2 normDir = normalize(dir);
vec2 velocity = normDir * f;
```

Since:

- `dir = mousePos - pos.xy`
- `normDir` points from particle toward cursor
- `f` is negative inside the influence zone

the final `velocity` points away from the cursor.

Important shape:

- strongest near the cursor center
- falls to `0` near the edge of the disturbed zone

So the reference does have direct repulsion.

### 12. The Repulsion Is Only Part Of The Effect

The more interesting part is this block:

```glsl
vec2 mouseXY = pos.xy;
float d = sdCapsule(mouseXY, mousePos.xy, mousePos.xy, preyRadius);
float mouseRatio = (1.0 - smoothstep(-preyRadius * 4.0, 2.0, d)) * 0.5;
vec2 mouseMotion = normalize(mouseXY + vec2(step(0.0001, -length(mouseXY)))) * mouseRatio * 10.0;
mouseMotion += (mousePos.xy) * mouseRatio * mix(2.0, 1.0, 1.0);
target.xy += mouseMotion * 10.0;
target.x += velocity.x;
target.y += velocity.y;
```

This means the disturbed target is built from three ingredients:

- target field from curl noise
- direct repulsion away from cursor
- extra deformation term called `mouseMotion`

The reference feel depends heavily on `mouseMotion`.

### 13. `mouseMotion` Is Not “Motion Along Mouse Delta”

Despite the name, `mouseMotion` is not derived from actual mouse velocity.

It is built from:

- a signed-distance-based falloff around the cursor
- a radial term based on the particle position relative to world origin
- a direct term based on `mousePos`

So the shader is not pushing particles based on cursor movement direction.

It is warping the target field around the cursor using a spatial mask.

That is why the result feels like elastic deformation, not like brush-stroking particles.

### 14. `sdCapsule` Is Used Like A Circle Mask

The code calls:

```glsl
sdCapsule(mouseXY, mousePos.xy, mousePos.xy, preyRadius)
```

This uses the same point for both capsule endpoints.

Practical meaning:

- the helper is being used like a radial signed-distance function around the cursor
- conceptually this is a circular influence mask

Important quirk:

- mathematically, a zero-length capsule is awkward
- the source code does not guard the `dot(ba, ba)` denominator
- but this is the exact code the reference runs

This is one of the places where the bundle is “looks-right code”, not clean math.

### 15. `mouseRatio` Is The Main Local Influence Envelope

The falloff is:

```glsl
float mouseRatio = (1.0 - smoothstep(-preyRadius * 4.0, 2.0, d)) * 0.5;
```

This produces:

- a broad, soft area of influence
- not a hard edge
- the final value is halved with `* 0.5`

That value controls how strongly the extra deformation term bends the local target field.

### 16. The Radial Term Is Relative To World Origin, Not Cursor

The first `mouseMotion` term is:

```glsl
normalize(mouseXY + vec2(step(0.0001, -length(mouseXY)))) * mouseRatio * 10.0;
```

Since:

- `mouseXY = pos.xy`

this is effectively:

- normalized direction from simulation origin toward the particle

That is a very important discovery.

The reference is not only “pushing away from cursor”.
It also injects a strong outward-from-center bias into the disturbed target field.

And then the whole `mouseMotion` vector is multiplied again by `10.0` when applied to `target.xy`.

So this radial term becomes very strong.

### 17. The Direct Mouse Term Is Simpler Than It Looks

This line:

```glsl
mouseMotion += (mousePos.xy) * mouseRatio * mix(2.0, 1.0, 1.0);
```

reduces to:

```glsl
mouseMotion += mousePos.xy * mouseRatio;
```

because:

- `mix(2.0, 1.0, 1.0) == 1.0`

So the source still contains an unnecessary expression from experimentation.

### 18. The Interaction Changes Target, Not Just Velocity

The key structural point is this:

- the cursor does not directly overwrite `pos`
- it does not directly set a velocity texture from mouse delta
- it changes the target that the spring acceleration is pulling toward

That is why the reference recovers gracefully.

After the cursor moves away:

- the extra local deformation disappears
- particles are still attached to the evolving curl-noise target field
- the system naturally re-forms

This is the core reason the effect feels elegant.

## Shading Changes Near The Cursor

### 19. `colored` Defines The Interaction Highlight Region

The shader computes:

```glsl
if (dist < (preyRadius * 0.8)) {
  float minDist = max(preyRadius * 0.6, dist);
  colored = 1.0 - (
    (minDist - (preyRadius * 0.6)) /
    ((preyRadius * 0.8) - (preyRadius * 0.6))
  );
}
```

This creates:

- a fully active center region from `0` to `0.6 * preyRadius`
- a linear fade down to `0` between `0.6 * preyRadius` and `0.8 * preyRadius`
- no extra coloring outside that range

So the interaction region has:

- an outer deformation zone
- a smaller inner shading zone

### 20. The Cursor Affects Tone Through `colored`, Not Alpha

`colored` is written to `acceleration.w`, then propagated through velocity and positions.

In the render shader, it becomes:

```glsl
float intensity = 1.0 - colored;
color += ((1.0 - color) * intensity);
```

Meaning:

- outside the interaction zone, particles stay closer to white
- inside the strong interaction zone, more of the gradient tone is preserved

So the cursor changes both:

- geometry
- tone

This is crucial to the richness of the reference feel.

## Important Quirks And Mismatches Between Intent And Actual Output

### 21. `target.z = 1.0` Looks Like An Intended Speed Boost

Inside the disturbed zone, the shader sets:

```glsl
target.z = 1.0;
```

Outside, it defines:

```glsl
float outside = 0.2;
```

And the positions pass later uses:

```glsl
newPos = currentPosition.xy + (velocity.xy * velocity.z);
```

So the apparent design intent is:

- normal particles move with multiplier `0.2`
- disturbed particles move with multiplier `1.0`

### 22. But The Acceleration Shader Does Not Actually Output `target.z`

The final line is:

```glsl
gl_FragColor = vec4(vec2(ax, ay), outside, colored);
```

That means:

- `acceleration.z` is always `outside`
- and `outside` is always `0.2`

So by literal reading of the bundle:

- the intended local speed boost is not actually written out
- `velocity.z` should remain `0.2`

This is a critical observation.

There is a mismatch between the apparent idea of the code and the actual output.

### 23. Velocity Pass Has Another Important Quirk

From [reference/app.js:54197](/Users/viacheslav.guzhov/Documents/IdeaProjects/Personal%20Site/reference/app.js:54197):

```glsl
vec4 oldVelocity = texture2D(accelerationTexture, uv);
```

instead of sampling `oldVelocityTexture`.

That means:

- the shader is not integrating prior velocity in a normal way
- it is effectively using the current acceleration texture twice

So the interaction feel is partly produced by this unusual, probably accidental, behavior.

### 24. Several Mouse-Related Values Are Dead Or Semi-Dead

Examples:

- `oldMousePos` uniform is written but unused
- `mouseUV` is computed, and `angle` is derived from it, but `angle` is unused
- `lMouse` is computed but unused
- `diff` is computed but unused
- `delta` uniform exists but is unused

So the source contains leftovers from experimentation.

This matters because:

- not every symbol in the reference is part of the real behavior
- only a smaller subset is visually important

## What Must Be Preserved In Our Implementation

If we want our implementation to feel like the reference, these points are non-negotiable:

1. Project the cursor onto the simulation plane with the active camera.

2. Flip projected `y` before writing to the simulation uniform.

3. Keep a JS-side smoothed mouse state instead of feeding raw cursor coordinates directly into the shader.

4. Keep a separate `screenMouse` vector based on distance from viewport center.

5. Drive `repulseRadius` from `screenMouse`, not from particle-space values.

6. Apply mouse interaction by deforming the spring target field, not by rotating the whole system.

7. Keep a broad outer distortion zone and a smaller inner tone-change zone.

8. Preserve the strong outward-from-origin term inside the disturbed target field, because it materially changes the look.

9. Preserve the fact that the system naturally re-forms after the mouse passes because particles remain attached to the curl-noise target field.

10. Decide explicitly whether to reproduce the two important quirks:

- the apparent missing `target.z -> output.z` speed boost
- the velocity pass reading `accelerationTexture` instead of `oldVelocityTexture`

Those two are likely part of why the reference interaction feels unusual.

## Practical Implementation Guidance

For our Angular component, the safest clean-room reproduction path is:

1. Keep the same mouse projection model as `ProjectorHelper`.

2. Keep the same JS-side smoothing behavior:

- instant first set
- eased updates after that

3. Keep the same `repulseRadius` formula driven by viewport position.

4. In the acceleration shader, preserve:

- `dir = mousePos - pos.xy`
- repulsion term
- soft mask via `mouseRatio`
- strong outward-from-origin term
- direct mouse-position term
- inner `colored` zone

5. Treat the speed multiplier mismatch as an explicit compatibility choice:

- if we want to match the literal source, keep output `z = 0.2`
- if we want to match the apparent intent, output `target.z`

6. Treat the velocity pass quirk the same way:

- clean version: sample `oldVelocityTexture`
- source-compatible version: sample `accelerationTexture`

The right choice for visual matching may be the source-compatible version, not the mathematically clean one.

## Short Summary

The mouse interaction in the reference is not “particles move away from cursor”.

It is this:

- project cursor to world plane
- smooth it on the JS side
- grow or shrink interaction radius based on viewport position
- distort the local curl-noise target field
- add repulsion
- add a strong outward-from-origin deformation term
- modulate shading in a smaller inner zone
- also change the global field time-speed according to cursor position on screen

That combination is what gives the reference its elastic, elegant, non-rotational mouse behavior.
