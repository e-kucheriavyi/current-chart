import { initCurrentChart, initRelayDemo, initTransformerDemo } from "./src"

const init = () => {
	const nodes = document.querySelectorAll(".current-chart")

	nodes.forEach((node) => {
		initCurrentChart(node as HTMLElement)
	})

	const nodes2 = document.querySelectorAll(".transformer-demo")

	nodes2.forEach((node) => {
		initTransformerDemo(node as HTMLElement)
	})

	const nodes3 = document.querySelectorAll(".relay-demo")

	nodes3.forEach((node) => {
		initRelayDemo(node as HTMLElement)
	})
}

init()

