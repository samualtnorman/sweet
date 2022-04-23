import { assertTypesAreCompatible, Context, TypeKind } from "."
import { Node } from "../parse"
import evaluateExpressionType from "./evaluateExpressionType"

export function passExpressions(expressions: Node.Expression[], context: Context): void {
	for (const expression of expressions)
		assertTypesAreCompatible(evaluateExpressionType(expression, context), { kind: TypeKind.Null })
}

export default passExpressions
