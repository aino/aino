export default function ThreeBody() {
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 400
  const ctx = canvas.getContext('2d')
  const SCALE = 150 // Position scale factor
  const MASS = 1 // Each mass is equal
  const G = 1 // Gravitational constant (works for these special ICs)
  const dt = 0.005 // Time step per physics iteration
  const STEPS_PER_FRAME = 10 // Increase this for faster animation

  const bodies = [
    // Body 1
    {
      x: -0.97000436 * SCALE,
      y: 0.24308753 * SCALE,
      vx: 0.466203685 * SCALE,
      vy: 0.43236573 * SCALE,
      mass: MASS,
    },
    // Body 2
    {
      x: 0.97000436 * SCALE,
      y: -0.24308753 * SCALE,
      vx: 0.466203685 * SCALE,
      vy: 0.43236573 * SCALE,
      mass: MASS,
    },
    // Body 3
    {
      x: 0 * SCALE,
      y: 0 * SCALE,
      vx: -0.93240737 * SCALE,
      vy: -0.86473146 * SCALE,
      mass: MASS,
    },
  ]

  // -----------------------------
  // 3. Velocity Verlet Integrator
  // -----------------------------
  // For each body, we need acceleration caused by the other bodies.
  function computeAccelerations(state) {
    // state is an array of objects: { x, y, vx, vy, mass }
    // return an array of { ax, ay } for each body
    const a = state.map(() => ({ ax: 0, ay: 0 }))
    for (let i = 0; i < state.length; i++) {
      for (let j = 0; j < state.length; j++) {
        if (i === j) continue
        const dx = state[j].x - state[i].x
        const dy = state[j].y - state[i].y
        const r2 = dx * dx + dy * dy
        // Safety check to avoid extreme blow-ups if they're extremely close:
        const r = Math.max(Math.sqrt(r2), 1e-6)
        const force = (G * state[j].mass) / r2
        // Add acceleration
        a[i].ax += force * (dx / r)
        a[i].ay += force * (dy / r)
      }
    }
    return a
  }

  function velocityVerletStep() {
    // 1. Compute current accelerations
    const acc = computeAccelerations(bodies)

    // 2. Half-step update velocities and full-step positions
    for (let i = 0; i < bodies.length; i++) {
      bodies[i].vx += 0.5 * acc[i].ax * dt
      bodies[i].vy += 0.5 * acc[i].ay * dt

      bodies[i].x += bodies[i].vx * dt
      bodies[i].y += bodies[i].vy * dt
    }

    // 3. Compute new accelerations (after position update)
    const accNew = computeAccelerations(bodies)

    // 4. Half-step update velocities with new accelerations
    for (let i = 0; i < bodies.length; i++) {
      bodies[i].vx += 0.5 * accNew[i].ax * dt
      bodies[i].vy += 0.5 * accNew[i].ay * dt
    }
  }

  // -----------------------------
  // 4. Drawing
  // -----------------------------
  function draw() {
    // Move origin to canvas center
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.globalAlpha = 1
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw lines between each pair of bodies
    ctx.strokeStyle = '#000'
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        ctx.beginPath()
        ctx.moveTo(bodies[i].x, bodies[i].y)
        ctx.lineTo(bodies[j].x, bodies[j].y)
        ctx.stroke()
      }
    }

    // Draw each body as a circle
    bodies.forEach((b) => {
      ctx.beginPath()
      ctx.arc(b.x, b.y, 5, 0, 2 * Math.PI)
      ctx.fillStyle = '#000'
      ctx.fill()
    })
  }

  // -----------------------------
  // Drawing
  // -----------------------------
  return {
    canvas,
    render: () => {
      for (let s = 0; s < STEPS_PER_FRAME; s++) {
        velocityVerletStep()
      }

      draw()
    },
  }
}
