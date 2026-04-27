import { initRange } from "./controls.ts"
import { throttle, lerp, scaleColor } from "./utils.ts"

type Canvas = HTMLCanvasElement & {
	skipped: number
	t: number
	mounted: boolean
}

type Config = {
	controls: boolean
	active: boolean
	stage: number
	speed: number
}

const getConfig = (canvas: Canvas) => {
	const p = canvas.parentNode as HTMLElement
	const controls = p.getAttribute("data-controls") ?? false
	const active = p.getAttribute("data-active") ?? 0
	const stage = p.getAttribute("data-stage") ?? 0
	const speed = p.getAttribute("data-speed") ?? 0.1
	const cfg: Config = {
		controls: Boolean(controls),
		stage: Number(stage),
		active: Number(active) === 1,
		speed: Number(speed),
	}
	return cfg
}

const resize = (canvas: Canvas, opts: Opts) => {
	canvas.width = canvas.clientWidth * opts.resolutionScale
	canvas.height = canvas.clientHeight * opts.resolutionScale
}

const clear = (canvas: Canvas, ctx: CanvasRenderingContext2D) => {
	ctx.clearRect(0, 0, canvas.width, canvas.height)
}

type Stage = (canvas: Canvas, ctx: CanvasRenderingContext2D, cfg: Config, opts: Opts) => void

const drawCoil: Stage = (canvas, ctx, _cfg, opts) => {
	// coil
	const fg = opts.wireColor
	ctx.fillStyle = fg
	const bg = scaleColor(ctx.fillStyle, 0.8)

	const w = 1
	const h = 1

	const coil = {
		x: -w*0.8,
		y: -h*0.5,
		w,
		h,
		steps: 10,
	}

	ctx.save()

	ctx.translate(coil.x, coil.y)

	ctx.strokeStyle = "red"
	ctx.lineWidth = 0.04
	ctx.lineCap = "round"
	ctx.lineJoin = "round"

	// gate
	ctx.beginPath()
	ctx.moveTo(0.2, 0.9)

	ctx.lineTo(lerp(0, 0.2, canvas.t), 0.7)

	ctx.stroke()

	// legs
	ctx.strokeStyle = bg

	ctx.beginPath()
	ctx.moveTo(0.2, 0.9)
	ctx.lineTo(0.2, 1)
	ctx.stroke()

	ctx.beginPath()

	ctx.moveTo(0.2, 0)
	ctx.lineTo(0.2, 0.7)
	ctx.stroke()

	// signs
	ctx.lineWidth = 0.03
	ctx.strokeStyle = "red"

	ctx.beginPath()

	ctx.moveTo(0.1, 0.95)
	ctx.lineTo(0, 0.95)
	ctx.moveTo(0.05, 0.9)
	ctx.lineTo(0.05, 1)

	ctx.stroke()

	ctx.strokeStyle = "blue"

	ctx.beginPath()

	ctx.moveTo(0.9, 0.95)
	ctx.lineTo(1, 0.95)

	ctx.stroke()

	const step = 0.8 / coil.steps
	const stepH = 0.6

	ctx.strokeStyle = bg
	ctx.lineCap = "round"
	ctx.lineWidth = 0.04
	ctx.lineJoin = "round"

	ctx.beginPath()

	ctx.moveTo(0.2, 0)

	for (let x = 0.2; x < 0.8; x += step) {
		ctx.moveTo(x, 0)
		ctx.lineTo(x, stepH)
	}

	ctx.stroke()

	ctx.strokeStyle = fg

	ctx.beginPath()
	for (let x = 0.2; x < 0.8; x += step) {
		ctx.moveTo(x, 0)
		ctx.lineTo(x+step, stepH)
	}
	ctx.lineTo(0.84, 1)
	ctx.stroke()

	ctx.restore()

}

const drawLever: Stage = (canvas, ctx, _cfg, _opts) => {
	const l = 0.8

	const lever = {
		x: l*0.3,
		y: -l*0.8,
		w: l * 0.1,
		l,
	}

	ctx.save()
	ctx.translate(lever.x, lever.y)
	ctx.scale(l, l)

	ctx.lineWidth = lever.w
	ctx.rotate(lerp(0, -Math.PI*0.03, canvas.t))

	ctx.strokeStyle = "#444"

	ctx.lineWidth = lever.w*0.5
	ctx.beginPath()
	ctx.moveTo(0, l*0.8)
	ctx.lineTo(l*0.4, l*0.8)
	ctx.stroke()

	ctx.lineWidth = lever.w

	ctx.strokeStyle = "#777"

	ctx.beginPath()
	ctx.moveTo(-lever.l, 0)
	ctx.lineTo(0, 0)
	ctx.lineTo(0, lever.l)
	ctx.stroke()

	ctx.fillStyle = "#444"

	ctx.beginPath()
	ctx.arc(-lever.w*0.04, lever.w*0.06, lever.w*0.5, 0, Math.PI*2)
	ctx.fill()

	ctx.restore()
}

const drawPins: Stage = (canvas, ctx, _cfg, opts) => {
	const pins = {
		x: 0.37,
		y: -0.3,
		w: 0.03,
		l: 0.8,
		gap: 0.1,
	}

	ctx.save()
	ctx.translate(pins.x, pins.y)

	ctx.lineJoin = "round"
	ctx.lineCap = "round"
	ctx.lineWidth = pins.w
	ctx.strokeStyle = opts.wireColor

	let x = 0

	ctx.beginPath()

	ctx.moveTo(x, 0)
	ctx.lineTo(x, pins.l)

	x += pins.w + pins.gap

	ctx.moveTo(lerp(x-pins.gap, x+pins.gap, canvas.t), 0)
	ctx.lineTo(x, pins.l*0.5)
	ctx.lineTo(x, pins.l)

	x += pins.w + pins.gap
	ctx.moveTo(x, 0)
	ctx.lineTo(x, pins.l)

	ctx.stroke()

	ctx.restore()
}

const drawRelay: Stage = (canvas, ctx, cfg, opts) => {
	const s = Math.min(canvas.width, canvas.height) * 0.5

	ctx.save()

	ctx.translate(canvas.width * 0.5, canvas.height * 0.5)
	ctx.scale(s, s)

	ctx.strokeStyle = "#fff"

	ctx.lineWidth = 0.01

	drawCoil(canvas, ctx, cfg, opts)

	if (cfg.stage === 0) {
		ctx.restore()
		return
	}

	// lever
	
	drawLever(canvas, ctx, cfg, opts)
	
	if (cfg.stage === 1) {
		ctx.restore()
		return
	}

	// pins
	
	drawPins(canvas, ctx, cfg, opts)
	
	ctx.restore()
}

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

	canvas.t += cfg.speed * (cfg.active ? 1 : -1)

	if (canvas.t > 1) {
		canvas.t = 1
	}
	if (canvas.t < 0) {
		canvas.t = 0
	}

	clear(canvas, ctx)

	drawRelay(canvas, ctx, cfg, opts)

	requestAnimationFrame(() => {
		draw(canvas, ctx, opts)
	})
}


type Opts = {
	fpsSkip: number
	resolutionScale: number
	font: string
	padding: number
	wireColor: string
}

export type RelayOpts = {
	fpsSkip?: number
	resolutionScale?: number
	font?: string
	padding?: number
	wireColor?: string
}

export const initRelayDemo = (node: HTMLElement, options: RelayOpts = {}) => {
	const opts: Opts = {
		resolutionScale: options.resolutionScale ?? 2.0,
		font: options.font ?? "32px bold",
		padding: options.padding ?? 16,
		fpsSkip: options.fpsSkip ?? 2,
		wireColor: options.wireColor ?? "orange",
	}

	const canvas = document.createElement("canvas") as Canvas
	canvas.skipped = 0
	canvas.t = 0
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

	if (cfg.controls) {
		canvas.style = "width: 100%; height: 90%;"
		const btn = document.createElement("button")
		btn.innerText = "Inactive"

		btn.addEventListener("click", () => {
			const { active } = getConfig(canvas)
			node.setAttribute("data-active", String(active ? 0 : 1))
			btn.innerText = !active ? "Active" : "Inactive" // flipped because of const
		})

		const stageRange = initRange(node, { value: cfg.stage, min: 0, max: 2, step: 1, name: "data-stage"})

		cr.appendChild(stageRange)
		cr.appendChild(btn)
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

