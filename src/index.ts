const throttle = (fn: Function, delay: number = 250) => {
	let last = 0
	return function(...args: any[]) {
		const now = Date.now()
		if (now - last >= delay) {
			last = now
			// @ts-ignore
			fn.apply(this, args)
		}
	}
}

const FONT = "32px bold"
const PAD = 10
const GRID_WIDTH = 4
const GRID_COLOR = "#fff"
const LINE_WIDTH = 8
const LINE_COLOR = "blue"

type Canvas = HTMLCanvasElement & { phase: number }

const zeroY = (h: number) => h * 0.5

const clear = (canvas: Canvas, ctx: CanvasRenderingContext2D) => {
	ctx.clearRect(0, 0, canvas.width, canvas.height)
}

const getPositiveY = (h: number, cfg: Config) => {
	const { voltage, maxVoltage } = cfg
	return zeroY(h) - (voltage / maxVoltage) * h * 0.5
}

const drawAxis = (canvas: Canvas, ctx: CanvasRenderingContext2D, cfg: Config) => {
	const { voltage, maxVoltage } = cfg
	const w = canvas.width
	const h = canvas.height
	ctx.font = FONT

	const zero = zeroY(h)

	ctx.lineWidth = GRID_WIDTH

	ctx.strokeStyle = GRID_COLOR

	ctx.beginPath()

	ctx.moveTo(PAD, PAD)
	ctx.lineTo(PAD, h - PAD)
	ctx.moveTo(PAD, zero)
	ctx.lineTo(w - PAD, zero)
	ctx.stroke()

	ctx.fillStyle = GRID_COLOR
	ctx.fillText(`${maxVoltage} V`, PAD * 2, PAD * 3)
	ctx.fillText(`${voltage} V`, PAD * 2, getPositiveY(h, cfg))
	ctx.fillText(`-${maxVoltage} V`, PAD * 2, h - PAD)
	ctx.fillText(`0 V`, PAD * 2, zero - PAD)
}

type SinOpts = {
	skip?: boolean
	half?: boolean
}

const drawSin = (
	canvas: Canvas, ctx: CanvasRenderingContext2D, phase: number,
	cfg: Config,
	{ skip = false, half = false }: SinOpts,
) => {
	const w = canvas.width
	const h = canvas.height

	ctx.lineWidth = LINE_WIDTH
	ctx.strokeStyle = LINE_COLOR

	ctx.beginPath()

	const { freq } = cfg

	const amp = h*0.5 - getPositiveY(h, cfg)

	const zero = zeroY(h)

	let first = true

	const frequency = freq / 1000

	for (let x = PAD * 1.6; x < w; x++) {
		let y = h / 2 + Math.sin(x * frequency + phase) * amp

		if (skip && y > zero) {
			y = zero
		}

		if (half && y > zero) {
			first = true
			continue
		}
	
		if (first) {
			ctx.moveTo(x, y)
			first = false
		} else {
			ctx.lineTo(x, y)
		}
	}
	ctx.stroke()
}

const drawAC = (canvas: Canvas, ctx: CanvasRenderingContext2D, cfg: Config) => {
	ctx.lineWidth = LINE_WIDTH
	ctx.strokeStyle = LINE_COLOR

	drawSin(canvas, ctx, canvas.phase, cfg, {})
}

const drawPreDC = (canvas: Canvas, ctx: CanvasRenderingContext2D, cfg: Config) => {
	ctx.lineWidth = LINE_WIDTH
	ctx.strokeStyle = LINE_COLOR

	drawSin(canvas, ctx, canvas.phase, cfg, { skip: true })
}

const drawDC = (canvas: Canvas, ctx: CanvasRenderingContext2D, cfg: Config) => {
	const w = canvas.width
	const h = canvas.height

	ctx.strokeStyle = LINE_COLOR
	ctx.lineWidth = LINE_WIDTH

	const positiveY = getPositiveY(h, cfg)

	ctx.beginPath()
	ctx.moveTo(PAD, positiveY)
	ctx.lineTo(w - PAD, positiveY)
	ctx.stroke()
}

const drawDCWithFreq = (canvas: Canvas, ctx: CanvasRenderingContext2D, cfg: Config) => {
	ctx.lineWidth = LINE_WIDTH
	ctx.strokeStyle = LINE_COLOR

	drawSin(canvas, ctx, canvas.phase, cfg, { half: true })
	drawSin(canvas, ctx, canvas.phase + 3, cfg, { half: true })
}

const drawPWM = (canvas: Canvas, ctx: CanvasRenderingContext2D, cfg: Config) => {
	const w = canvas.width
	const h = canvas.height

	const { freq, len } = cfg

	const f = freq > 0 ? freq : 1

	const zero = zeroY(h)

	ctx.lineWidth = LINE_WIDTH
	ctx.strokeStyle = LINE_COLOR

	ctx.beginPath()
	
	const step = w / f
	const highstep = step * len
	const lowstep = step - highstep

	const posY = getPositiveY(h, cfg)

	if (len === 0) {
		ctx.moveTo(PAD, zero)
		ctx.lineTo(w - PAD, zero)
		ctx.stroke()
		return
	} else if (len === 1) {
		ctx.moveTo(PAD, posY)
		ctx.lineTo(w - PAD, posY)
		ctx.stroke()
		return
	}

	let x = canvas.phase * -1 * 100

	ctx.moveTo(x, posY)

	while (true) {
		x += highstep
		ctx.lineTo(x, posY)
		ctx.lineTo(x, zero)
		x += lowstep
		ctx.lineTo(x, zero)
		ctx.lineTo(x, posY)

		if (x > w - PAD) {
			break
		}
	}

	ctx.stroke()
}

type Type = "AC" | "PREDC" | "DC" | "PWM"

type Config = {
	type: Type
	freq: number
	len: number
	voltage: number
	maxVoltage: number
	speed: number
	controls: boolean
}

const getConfig = (node: HTMLElement) => {
	const voltage = Number(node.getAttribute("data-voltage"))
	const freq = Number(node.getAttribute("data-freq"))
	const type = node.getAttribute("data-type") as Type
	const len = Number(node.getAttribute("data-len"))
	const maxVoltage = Number(node.getAttribute("data-max"))
	const controls = node.getAttribute("data-controls") ? true : false
	const speedAttr = node.getAttribute("data-speed")
	const speed = speedAttr !== null ? Number(speedAttr) : 0.01

	const config: Config = { type, voltage, freq, len, maxVoltage, controls, speed }
	return config
}

const draw = (canvas: Canvas, ctx: CanvasRenderingContext2D) => {
	const cfg = getConfig(canvas.parentNode as HTMLElement)

	const { type, freq, speed } = cfg
	clear(canvas, ctx)

	if (type === "AC") {
		drawAC(canvas, ctx, cfg)
	} else if(type === "PREDC") {
		drawPreDC(canvas, ctx, cfg)
	} else if (type === "DC") {
		if (freq === 0) {
			drawDC(canvas, ctx, cfg)
		} else {
			drawDCWithFreq(canvas, ctx, cfg)
		}
	} else if (type === "PWM") {
		drawPWM(canvas, ctx, cfg)
	}

	drawAxis(canvas, ctx, cfg)

	canvas.phase += speed

	requestAnimationFrame(() => {
		draw(canvas, ctx)
	})
}

const resize = (canvas: Canvas) => {
	canvas.width = canvas.clientWidth
	canvas.height = canvas.clientHeight
}

type RangeOpts = {
	name: string
	value: number
	min: number
	max: number
	step: number
}

const formatValue = (value: number) => {
	if (value <= 1) {
		return value.toFixed(2)
	}
	return `${value < 10 ? '0' : ''}${value}`
}

const initRange = (node: HTMLElement, { value, min, max, step, name }: RangeOpts) => {
	const c = document.createElement("div")
	c.style = "display: flex; flex: 1; color: #fff; font-size: 32px; text-align: center; gap: 4px;"

	const vl = document.createElement("div")
	vl.innerText = formatValue(value)

	const r = document.createElement("input")
	r.style = "flex: 1;"
	r.setAttribute("type", "range")
	r.setAttribute("name", name)
	r.setAttribute("min", String(min))
	r.setAttribute("max", String(max))
	r.setAttribute("value", String(value))
	r.setAttribute("step", String(step))

	r.addEventListener("input", (e) => {
		if (e.target !== null) {
			const v = (e.target as HTMLInputElement).value
			node.setAttribute(name, v)
			vl.innerText = formatValue(Number(v))
		}
	})

	c.appendChild(r)
	c.appendChild(vl)

	return c
}

const initSelect = (node: HTMLElement, value: Type) => {
	const s = document.createElement("select")

	const items = ["AC", "PREDC", "DC", "PWM"]

	items.forEach((item) => {
		const o = document.createElement("option")
		o.innerText = item
		o.value = item
		s.appendChild(o)
	})

	s.value = value

	s.addEventListener("change", (e) => {
		if (e.target !== null) {
			node.setAttribute("data-type", (e.target as HTMLInputElement).value)
		}
	})

	return s
}

export const initCurrentChart = (node: HTMLElement) => {
	const canvas = document.createElement("canvas") as Canvas
	canvas.phase = 0
	const ctx = canvas.getContext("2d")

	if (!ctx) {
		return
	}

	node.appendChild(canvas)

	const cr = document.createElement("dev")
	cr.style = "display: flex; align-items: center; justify-content: center; padding: 8px; gap: 8px;"

	const { voltage, maxVoltage, len, freq, type, controls, speed } = getConfig(node)

	canvas.style = "width: 100%; height: 100%;"

	if (controls) {
		canvas.style = "width: 100%; height: 90%;"

		const voltageRange = initRange(
			node, { value: voltage, min: 0, max: 300, step: 1, name: "data-voltage" },
		)
		const maxVoltageRange = initRange(
			node, { value: maxVoltage, min: 0, max: 300, step: 1, name: "data-max" },
		)
		const freqRange = initRange(
			node, { value: freq, min: 0, max: 50, step: 1, name: "data-freq" },
		)
		const lenRange = initRange(
			node, { value: len, min: 0, max: 1, step: 0.01, name: "data-len" },
		)
		const speedRange = initRange(
			node, { value: speed, min: 0.01, max: 0.5, step: 0.01, name: "data-speed" },
		)
		const s = initSelect(node, type)

		cr.appendChild(s)
		cr.appendChild(voltageRange)
		cr.appendChild(maxVoltageRange)
		cr.appendChild(freqRange)
		cr.appendChild(lenRange)
		cr.appendChild(speedRange)

		node.appendChild(cr)
	}

	resize(canvas)

	window.addEventListener("resize", throttle(() => { resize(canvas) }))

	draw(canvas, ctx)
}

