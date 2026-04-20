export const throttle = (fn: Function, delay: number = 250) => {
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

export const lerp = (a: number, b: number, t: number) => a + (b-a)*t

export const formatValue = (value: number) => {
	if (value <= 1) {
		return value.toFixed(2)
	}
	return value.toString().padStart(2, "0")
}

export const colorOpacity = (color: string, opacity: number) => {
	if (color.startsWith("#")) {
		const alpha = Math.floor(opacity * 255)
		const a = (alpha).toString(16).padStart(2, "0")
		switch (color.length) {
			case 7: return `${color}${a}` // #rrggbb
			case 4: // #rgb
				const [r, g, b] = color.replace("#", "").split("")
				return `#${r}${r}${g}${g}${b}${b}${a}`
			case 9: return `${color.slice(0, 7)}${a}` // #rrggbbaa
			default: return color // ?
		}
	} else if (color.startsWith("rgba")) {
		const vals = color
			.replace("rgba(", "")
			.replace(")", "")
			.replace(",", "")
			.split(" ")

		const r = vals[0]
		const g = vals[1]
		const b = vals[2]

		return `rgba(${r}, ${g}, ${b}, ${opacity})`
	} else if (color.startsWith("rgb")) {
		console.log("not implemented")
		return color
	} else {
		console.log("not implemented")
		return color
	}
}

export const scaleColor = (color: string, scale: number) => {
	if (color.startsWith("#")) {
		const c = color.replace("#", "")

		const mul = (v: string) => (parseInt(v, 16)*scale).toString(16).padStart(2, "0")

		switch (c.length) {
			case 3: {
				const [r, g, b] = c.split("")
				return `#${mul(r)}${mul(g)}${mul(b)}`
			}
			case 6: {
				const r = c.slice(0, 2)
				const g = c.slice(2, 4)
				const b = c.slice(4, 6)
				const res = `#${mul(r)}${mul(g)}${mul(b)}`
				return res
			}
			case 8: {
				const r = c.slice(0, 2)
				const g = c.slice(2, 4)
				const b = c.slice(4, 6)
				const a = c.slice(6, 8)
				return `#${mul(r)}${mul(g)}${mul(b)}${a}`
			}
			default:
				return color
		}
	} else {
		return color
	}
}

