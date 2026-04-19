import { initCurrentChart } from "./src"
import { initTransfromerDemo } from "./src"

const init = () => {
	const nodes = document.querySelectorAll(".current-chart")

	nodes.forEach((node) => {
		initCurrentChart(node as HTMLElement)
	})

	const nodes2 = document.querySelectorAll(".transformer-demo")

	nodes2.forEach((node) => {
		initTransfromerDemo(node as HTMLElement)
	})
}

init()

