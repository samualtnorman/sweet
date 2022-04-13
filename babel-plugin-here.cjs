/* eslint-disable @typescript-eslint/no-var-requires */

const { relative: getRelativeFilePath } = require(`path`)

module.exports = ({ types: t }) => ({
	name: `test`,
	visitor: {
		Program(path) {
			if (!path.scope.hasGlobal(`HERE`))
				return

			const [ variableDeclarationPath ] = path.unshiftContainer(
				`body`,
				t.variableDeclaration(
					`let`,
					[ t.variableDeclarator(t.identifier(`HERE`)) ]
				)
			)

			path.scope.crawl()

			for (const referencePath of path.scope.getBinding(`HERE`).referencePaths) {
				const path = getRelativeFilePath(`.`, this.file.opts.filename).replaceAll(`\\`, `/`)
				const line = referencePath.node.loc.start.line
				const column = referencePath.node.loc.start.column + 1
				const location = `${path}:${line}:${column}`

				if (referencePath.parent.type == `TemplateLiteral`) {
					const index = referencePath.parent.expressions.indexOf(referencePath.node)

					referencePath.parent.expressions.splice(index, 1)
					delete referencePath.parent.quasis[index].value.cooked

					const quasiBefore = referencePath.parent.quasis[index].value.raw
					const quasiAfter = referencePath.parent.quasis[index + 1].value.raw

					referencePath.parent.quasis[index].value.raw = `${quasiBefore}${location}${quasiAfter}`
					referencePath.parent.quasis[index].tail = referencePath.parent.quasis[index + 1].tail
					referencePath.parent.quasis.splice(index + 1, 1)
				} else
					referencePath.replaceWith(t.stringLiteral(location))
			}

			variableDeclarationPath.remove()
		}
	}
})
