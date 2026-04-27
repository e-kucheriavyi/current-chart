import { throttle, lerp, scaleColor } from "./utils.ts"
import { initRange } from "./controls.ts"

type Canvas = HTMLCanvasElement & {
	skipped: number
	phase: number
	phaseLiveWire: number
	phaseWave: number
	wireSize: number
	waveWireSize: number
	wireSizeTransition: number
	mounted: boolean
}

const resize = (canvas: Canvas, opts: Opts) => {
	canvas.width = canvas.clientWidth * opts.resolutionScale
	canvas.height = canvas.clientHeight * opts.resolutionScale
}

const clear = (canvas: Canvas, ctx: CanvasRenderingContext2D) => {
	ctx.clearRect(0, 0, canvas.width, canvas.height)
}

type Config = {
	stage: number
	controls: boolean
	speed: number
	freq: number
	firstCoilWidth: number
	secondCoilWidth: number
	firstCoilSteps: number
	secondCoilSteps: number
}

const getConfig = (canvas: Canvas) => {
	const p = canvas.parentNode as HTMLElement
	const stg = p.getAttribute("data-stage") ?? 0
	const asteps = p.getAttribute("data-first-coil") ?? 10
	const bsteps = p.getAttribute("data-second-coil") ?? 5
	const awidth = p.getAttribute("data-first-width") ?? 8
	const bwidth = p.getAttribute("data-second-width") ?? 128
	const speed = p.getAttribute("data-speed") ?? 0.05
	const freq = p.getAttribute("data-freq") ?? 10
	const controls = p.getAttribute("data-controls") ?? false
	const cfg: Config = {
		stage: Number(stg),
		controls: Boolean(controls),
		speed: Number(speed),
		freq: Number(freq),
		firstCoilWidth: Number(awidth),
		secondCoilWidth: Number(bwidth),
		firstCoilSteps: Number(asteps),
		secondCoilSteps: Number(bsteps),
	}
	return cfg
}

type Stage = (
	canvas: Canvas,
	ctx: CanvasRenderingContext2D,
	cfg: Config,
	opts: Opts,
) => void

const drawWire: Stage = (canvas, ctx, _cfg, opts) => {
	canvas.wireSizeTransition = 0
	const cw = canvas.width
	const ch = canvas.height

	const h = ch * 0.2
	const y = ch * 0.5 - h * 0.5
	const x = 0

	ctx.fillStyle = opts.wireColor
	ctx.fillRect(x, y, cw, h)
}

const drawParticle = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
	ctx.beginPath()
	ctx.arc(x, y, r, 0, Math.PI * 2)
	ctx.fill()
}

const drawLiveWire: Stage = (canvas, ctx, cfg, opts) => {
	canvas.wireSizeTransition = 0
	const cw = canvas.width
	const ch = canvas.height
	const cy = ch * 0.5

	const h = ch * canvas.wireSize
	const y = cy - h * 0.5

	ctx.fillStyle = opts.wireColor
	ctx.fillRect(0, y, cw, h)

	ctx.fillStyle = opts.particleColor

	const r = h * 0.2

	for (let x = cw + canvas.phaseLiveWire * r; x >= -r; x -= r * 3) {
		drawParticle(ctx, x, cy + r, r)
		drawParticle(ctx, x + r, cy - r, r)
	}

	canvas.phaseLiveWire += cfg.speed

	if (canvas.phaseLiveWire >= 3) {
		canvas.phaseLiveWire = 0
	}
}

const drawWireTransition: Stage = (canvas, ctx, cfg, opts) => {
	canvas.wireSizeTransition += cfg.speed
	if (canvas.wireSizeTransition >= 1) {
		canvas.wireSizeTransition = 1
	}

	const cw = canvas.width
	const ch = canvas.height
	const cy = ch * 0.5

	const a = ch * canvas.wireSize
	const b = ch * canvas.waveWireSize
	const h = lerp(a, b, canvas.wireSizeTransition)
	const y = cy - h * 0.5

	ctx.fillStyle = opts.wireColor
	ctx.fillRect(0, y, cw, h)

	ctx.fillStyle = opts.particleColor

	const r = h * 0.2

	for (let x = cw + canvas.phaseLiveWire * r; x >= -r; x -= r * 3) {
		drawParticle(ctx, x, cy + r, r)
		drawParticle(ctx, x + r, cy - r, r)
	}

	canvas.phaseLiveWire += cfg.speed

	if (canvas.phaseLiveWire >= 3) {
		canvas.phaseLiveWire = 0
	}

}

const drawWireWave: Stage = (canvas, ctx, cfg, opts) => {
	canvas.wireSizeTransition = 1
	const cw = canvas.width
	const ch = canvas.height
	const cy = ch * 0.5

	const h = ch * canvas.waveWireSize
	const y = cy - h * 0.5

	// waves

	ctx.strokeStyle = opts.waveColor

	ctx.beginPath()
	
	const { freq } = cfg

	const amp = ch * 0.3

	let first = true

	const frequency = freq / 1000

	const p = opts.padding

	for (let x = p * 1.6; x < cw; x++) {
		let y = ch * 0.5 + Math.sin(x * frequency + canvas.phaseWave) * amp
	
		if (first) {
			ctx.moveTo(x, y)
			first = false
		} else {
			ctx.lineTo(x, y)
		}
	}
	ctx.stroke()

	canvas.phaseWave += cfg.speed

	// line

	ctx.fillStyle = opts.wireColor
	ctx.fillRect(0, y, cw, h)

	ctx.fillStyle = opts.particleColor

	const r = h * 0.2

	for (let x = cw + canvas.phaseLiveWire * r; x >= -r; x -= r * 3) {
		drawParticle(ctx, x, cy + r, r)
		drawParticle(ctx, x + r, cy - r, r)
	}

	canvas.phaseLiveWire += cfg.speed

	if (canvas.phaseLiveWire >= 3) {
		canvas.phaseLiveWire = 0
	}
}

const drawCoil: Stage = (canvas, ctx, cfg, opts) => {
	const ch = canvas.height
	const cw = canvas.width
	const cy = ch * 0.5
	const cx = cw * 0.5

	const s = 0.6
	const side = ch * s

	const w = side * 0.2

	const steps = cfg.firstCoilSteps

	const step = (side * 0.5) / steps

	const x = cx - side * 0.5
	const y = cy - side * 0.29

	ctx.lineCap = "round"
	ctx.lineJoin = "round"
	ctx.lineWidth = cfg.firstCoilWidth

	// inner wires

	ctx.strokeStyle = "#ffa500"
	ctx.strokeStyle = scaleColor(ctx.strokeStyle, 0.6)

	ctx.beginPath()

	ctx.moveTo(cx - side, y)

	for (let i = 0; i < steps; i++) {
		if (i === 0) {
			ctx.lineTo(x, y + (step * i))
		} else {
			ctx.lineTo(x, y + (step * i))
		}
		ctx.lineTo(x + w, y + (step * (i + 1)))
	}

	ctx.lineTo(cx - side, y + step * steps)

	ctx.stroke()

	// waves
	
	let start = canvas.phaseWave
	
	ctx.strokeStyle = opts.waveColor

	ctx.beginPath()
	ctx.ellipse(x - side * 0.05, y + side * 0.25, 50, side * 0.4, 0, start, start + Math.PI * 1.9)
	ctx.stroke()
	ctx.beginPath()
	ctx.ellipse(x + side * 0.25, y + side * 0.25, 50, side * 0.4, 0, start, start + Math.PI * 1.9)
	ctx.stroke()

	start += Math.PI * 0.5

	ctx.beginPath()
	ctx.ellipse(x - side * 0.05, y + side * 0.25, 75, side * 0.45, 0, start, start + Math.PI * 1.9)
	ctx.stroke()
	ctx.beginPath()
	ctx.ellipse(x + side * 0.25, y + side * 0.25, 75, side * 0.45, 0, start, start + Math.PI * 1.9)
	ctx.stroke()

	// outer wires

	ctx.strokeStyle = opts.wireColor

	ctx.beginPath()

	ctx.moveTo(cx - side, y)

	for (let i = 0; i < steps; i++) {
		if (i === 0) {
			ctx.lineTo(x, y + (step*i))
		} else {
			ctx.moveTo(x, y + (step*i))
		}
		ctx.lineTo(x + w, y + (step * (i + 1)))
	}

	ctx.stroke()

	canvas.phaseWave += cfg.speed
}

const drawCoils: Stage = (canvas, ctx, cfg, opts) => {
	const ch = canvas.height
	const cw = canvas.width
	const cy = ch * 0.5
	const cx = cw * 0.5

	const s = 0.6
	const side = ch * s

	const w = side * 0.2

	const asteps = cfg.firstCoilSteps

	const astep = (side * 0.5) / asteps

	const ax = cx - side * 0.5
	const y = cy - side * 0.29

	const bsteps = cfg.secondCoilSteps
	const bstep = (side * 0.5) / bsteps
	const bx = cx + side * 0.5

	ctx.lineCap = "round"
	ctx.lineJoin = "round"
	ctx.lineWidth = cfg.firstCoilWidth

	ctx.beginPath()

	ctx.moveTo(ax, y + (side * 0.5))
	ctx.lineTo(cx - side, y + (side * 0.5))

	ctx.stroke()

	ctx.lineWidth = cfg.secondCoilWidth

	ctx.beginPath()

	ctx.moveTo(bx, y + (side * 0.5))
	ctx.lineTo(cx + side, y + (side * 0.5))

	ctx.stroke()

	ctx.fillStyle = "#444"
	ctx.fillRect(cx - side * 0.5, cy - side * 0.5, side, side)
	ctx.clearRect(cx - side * 0.3, cy - side * 0.3, side * 0.6, side * 0.6)

	ctx.strokeStyle = opts.wireColor
	ctx.lineWidth = cfg.firstCoilWidth

	ctx.beginPath()

	ctx.moveTo(cx - side, y)

	for (let i = 0; i < asteps; i++) {
		if (i === 0) {
			ctx.lineTo(ax, y + (astep * i))
		} else {
			ctx.moveTo(ax, y + (astep * i))
		}
		ctx.lineTo(ax + w, y + (astep * (i + 1)))
	}

	ctx.stroke()

	// second coil
	ctx.lineWidth = cfg.secondCoilWidth

	ctx.beginPath()

	ctx.moveTo(cx + side, y)

	for (let i = 0; i < bsteps; i ++) {
		if (i === 0) {
			ctx.lineTo(bx, y + (bstep * i))
		} else {
			ctx.moveTo(bx, y + (bstep * i))
		}
		ctx.lineTo(bx - w, y + (bstep * (i + 1)))
	}

	ctx.stroke()
}


const stages: Stage[] = [
	drawWire,
	drawLiveWire,
	drawWireTransition,
	drawWireWave,
	drawCoil,
	drawCoils,
]

const draw = (canvas: Canvas, ctx: CanvasRenderingContext2D, opts: Opts) => {
	if (!canvas || !canvas.mounted) {
		return
	}

	canvas.skipped += 1

	if (canvas.skipped >= opts.fpsSkip) {
		canvas.skipped = 0
	} else {
		requestAnimationFrame(() => {
			draw(canvas, ctx, opts)
		})
		return
	}

	const cfg = getConfig(canvas)

	ctx.strokeStyle = opts.wireColor
	ctx.lineWidth = opts.lineWidth

	clear(canvas, ctx)

	stages[cfg.stage] && stages[cfg.stage](canvas, ctx, cfg, opts)

	requestAnimationFrame(() => {
		draw(canvas, ctx, opts)
	})
}


type Opts = {
	wireColor: string
	waveColor: string
	particleColor: string
	lineWidth: number
	fpsSkip: number
	resolutionScale: number
	font: string
	padding: number
}

export type TransformerOpts = {
	wireColor?: string
	lineWidth?: number
	particleColor?: string
	waveColor?: string
	fpsSkip?: number
	resolutionScale?: number
	font?: string
	padding?: number
}

export const initTransformerDemo = (node: HTMLElement, options: TransformerOpts = {}) => {
	const opts: Opts = {
		resolutionScale: options.resolutionScale ?? 2.0,
		lineWidth: options.lineWidth ?? 16.0,
		wireColor: options.wireColor ?? "orange",
		particleColor: options.particleColor ?? "blue",
		waveColor: options.waveColor ?? "blue",
		font: options.font ?? "32px bold",
		padding: options.padding ?? 16,
		fpsSkip: options.fpsSkip ?? 2,
	}

	const canvas = document.createElement("canvas") as Canvas
	canvas.skipped = 0
	canvas.phase = 0
	canvas.phaseLiveWire = 0
	canvas.phaseWave = 0
	canvas.wireSize = 0.2
	canvas.waveWireSize = 0.1
	canvas.wireSizeTransition = 0
	canvas.mounted = true
	const ctx = canvas.getContext("2d")

	if (!ctx) {
		return () => {}
	}

	node.appendChild(canvas)

	const cr = document.createElement("div")
	cr.style = "display: flex; align-items: center; justify-content: center; padding: 8px; gap: 8px;"

	const cfg = getConfig(canvas)

	canvas.style = "width: 100%; height: 100%;"

	const { stage, firstCoilSteps, secondCoilSteps, firstCoilWidth, secondCoilWidth } = getConfig(canvas)

	if (cfg.controls) {
		canvas.style = "width: 100%; height: 90%;"
		const stageRange = initRange(
			node, { value: stage, min: 0, max: stages.length-1, step: 1, name: "data-stage" },
		)
		const aStepsRange = initRange(
			node, { value: firstCoilSteps, min: 2, max: 100, step: 1, name: "data-first-coil" },
		)
		const bStepsRange = initRange(
			node, { value: secondCoilSteps, min: 2, max: 20, step: 1, name: "data-second-coil" },
		)
		const aWidthRange = initRange(
			node, { value: firstCoilWidth, min: 2, max: 128, step: 1, name: "data-first-width" },
		)
		const bWidthRange = initRange(
			node, { value: secondCoilWidth, min: 2, max: 128, step: 1, name: "data-second-width" },
		)
		cr.appendChild(stageRange)
		cr.appendChild(aStepsRange)
		cr.appendChild(aWidthRange)
		cr.appendChild(bStepsRange)
		cr.appendChild(bWidthRange)
		node.appendChild(cr)
	}

	resize(canvas, opts)

	const res = throttle(() => { resize(canvas, opts) })
	window.addEventListener("resize", res)

	draw(canvas, ctx, opts)

	return () => {
		canvas.mounted = false
		window.removeEventListener("resize", res)
	}
}

