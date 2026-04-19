export type RangeOpts = {
	name: string
	value: number
	min: number
	max: number
	step: number
	formatter?: (value: number) => string
}

export const initRange = (
	node: HTMLElement,
	{ value, min, max, step, name, formatter = (v) => `${v}` }: RangeOpts
) => {
	const c = document.createElement("div")
	c.style = "display: flex; flex: 1; color: #fff; font-size: 32px; text-align: center; gap: 4px;"
	c.setAttribute("title", name)

	const vl = document.createElement("div")
	vl.innerText = formatter(value)

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
			vl.innerText = formatter(Number(v))
		}
	})

	c.appendChild(r)
	c.appendChild(vl)

	return c
}

export type SelectOpts = {
	name: string
}

export const initSelect = (node: HTMLElement, value: string, items: string[], { name }: SelectOpts) => {
	const s = document.createElement("select")
	s.setAttribute("title", name)

	items.forEach((item) => {
		const o = document.createElement("option")
		o.innerText = item
		o.value = item
		s.appendChild(o)
	})

	s.value = value

	s.addEventListener("change", (e) => {
		if (e.target !== null) {
			node.setAttribute(name, (e.target as HTMLInputElement).value)
		}
	})

	return s
}
