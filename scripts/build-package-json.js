import { findFiles } from "@samual/lib"
import { readFile, writeFile } from "fs/promises"

// eslint-disable-next-line unicorn/prevent-abbreviations
const [ packageConfig, filesInDistFolder ] = await Promise.all([
	readFile(`package.json`, { encoding: `utf-8` }).then(JSON.parse),
	findFiles(`dist`)
])

delete packageConfig.private
delete packageConfig.scripts

for (let name of filesInDistFolder) {
	if (!name.endsWith(`.d.ts`))
		continue

	name = `.${name.slice(4, -5)}`

	const nameWithExtension = `${name}.js`

	packageConfig.exports[name] = nameWithExtension

	if (name != `./index` && name.endsWith(`/index`))
		packageConfig.exports[name.slice(0, -6)] = nameWithExtension
}

await writeFile(`dist/package.json`, JSON.stringify(packageConfig, undefined, `\t`))
