import { defineConfig } from "tsup"

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["cjs", "esm"],
	dts: false,
	minify: true,
	sourcemap: false,
	target: "esnext",
	clean: true,
})
