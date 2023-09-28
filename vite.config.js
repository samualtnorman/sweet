import { babel } from "@rollup/plugin-babel"
import babelPluginHere from "babel-plugin-here"

/** @type {import("vite").UserConfig} */ export default {
	// build: { rollupOptions: { plugins: [ babel({ plugins: [ babelPluginHere ] }) ] } },
	plugins: [ babel({ plugins: [ babelPluginHere ], extensions: [ ".ts", ".tsx" ] }) ],
	build: { sourcemap: false }
}
