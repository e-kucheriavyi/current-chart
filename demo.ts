import { initCurrentChart, initRelayDemo, initTransformerDemo } from "./src"

const init = () => {
	const nodes = document.querySelectorAll(".current-chart")

	nodes.forEach((node) => {
		const kill = initCurrentChart(node as HTMLElement)
		window.addEventListener("resize", () => kill())
	})

	const nodes2 = document.querySelectorAll(".transformer-demo")

	nodes2.forEach((node) => {
		const kill = initTransformerDemo(node as HTMLElement)
		window.addEventListener("resize", () => kill())
	})

	const nodes3 = document.querySelectorAll(".relay-demo")

	nodes3.forEach((node) => {
		const kill = initRelayDemo(node as HTMLElement)
		window.addEventListener("resize", () => kill())
	})
}

init()

