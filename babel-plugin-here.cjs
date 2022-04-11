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
				if (referencePath.parent.type == `TemplateLiteral`) {
					const index = referencePath.parent.expressions.indexOf(referencePath.node)

					referencePath.parent.expressions.splice(index, 1)
					delete referencePath.parent.quasis[index].value.cooked
					referencePath.parent.quasis[index].value.raw = `${referencePath.parent.quasis[index].value.raw}${getRelativeFilePath(`.`, this.file.opts.filename)}:${referencePath.node.loc.start.line}:${referencePath.node.loc.start.column + 1}${referencePath.parent.quasis[index + 1].value.raw}`
					referencePath.parent.quasis[index].tail = referencePath.parent.quasis[index + 1].tail
					referencePath.parent.quasis.splice(index + 1, 1)
				} else
					referencePath.replaceWith(t.stringLiteral(`${getRelativeFilePath(`.`, this.file.opts.filename)}:${referencePath.node.loc.start.line}:${referencePath.node.loc.start.column + 1}`))
			}

			variableDeclarationPath.remove()
		}
	}
})
