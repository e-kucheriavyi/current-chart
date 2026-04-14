import { initCurrentChart } from "./src"

const init = () => {
	const nodes = document.querySelectorAll(".current-chart")

	nodes.forEach((node) => {
		initCurrentChart(node as HTMLElement)
	})
}

init()

