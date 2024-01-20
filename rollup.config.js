import babelPresetTypescript from "@babel/preset-typescript"
import babel from "@rollup/plugin-babel"
import commonJS from "@rollup/plugin-commonjs"
import json from "@rollup/plugin-json"
import nodeResolve from "@rollup/plugin-node-resolve"
import { findFiles } from "@samual/lib/findFiles"
import babelPluginHere from "babel-plugin-here"
import { readFile } from "fs/promises"

/** @typedef {import("rollup").RollupOptions} RollupOptions */

const SOURCE_FOLDER = "src"

/** @type {(command: Record<string, unknown>) => Promise<RollupOptions>} */
export default async () => {
	const [ foundFiles, packageJsonString ] =
		await Promise.all([ findFiles(SOURCE_FOLDER), readFile("package.json", { encoding: "utf8" }) ])

	const packageJson = JSON.parse(packageJsonString)

	const externalDependencies = [
		..."dependencies" in packageJson ? Object.keys(packageJson.dependencies) : [],
		..."optionalDependencies" in packageJson ? Object.keys(packageJson.optionalDependencies) : []
	]

	return {
		input: Object.fromEntries(
			foundFiles.filter(path => path.endsWith(".ts") && !path.endsWith(".d.ts") && !path.endsWith(".test.ts"))
				.map(path => [ path.slice(SOURCE_FOLDER.length + 1, -3), path ])
		),
		output: { dir: "dist", interop: "auto", sourcemap: "inline" },
		plugins: [
			babel({
				babelHelpers: "bundled",
				extensions: [ ".ts" ],
				presets: [
					[ babelPresetTypescript, { allowDeclareFields: true, optimizeConstEnums: true } ]
				],
				plugins: [ babelPluginHere() ]
			}),
			commonJS(),
			json({ preferConst: true }),
			nodeResolve({ extensions: [ ".ts" ] })
		],
		external: source =>
			externalDependencies.some(dependency => source == dependency || source.startsWith(`${dependency}/`)),
		preserveEntrySignatures: "allow-extension",
		treeshake: { moduleSideEffects: false },
		strictDeprecations: true
	}
}
