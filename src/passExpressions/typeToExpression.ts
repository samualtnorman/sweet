import { Type, TypeKind } from "."
import { Expression, ExpressionKind } from "../parse"

export function typeToExpression(type: Type): Expression.Expression {
	switch (type.kind) {
		case TypeKind.Null:
			return { kind: ExpressionKind.Null }

		case TypeKind.True:
			return { kind: ExpressionKind.True }

		case TypeKind.False:
			return { kind: ExpressionKind.False }

		case TypeKind.UnsignedInteger:
			return { kind: ExpressionKind.UnsignedIntegerType, bits: type.bits }

		case TypeKind.SignedInteger:
			return { kind: ExpressionKind.SignedIntegerType, bits: type.bits }

		case TypeKind.Float16:
			return { kind: ExpressionKind.Float16Type }

		case TypeKind.Float32:
			return { kind: ExpressionKind.Float32Type }

		case TypeKind.Float64:
			return { kind: ExpressionKind.Float64Type }

		case TypeKind.Float128:
			return { kind: ExpressionKind.Float128Type }

		case TypeKind.Union: {
			if (type.members.length == 2) {
				return {
					kind: ExpressionKind.Or,
					left: typeToExpression(type.members[0]!),
					right: typeToExpression(type.members[1]!)
				}
			}

			return { kind: ExpressionKind.Or, right: typeToExpression(type.members.pop()!), left: typeToExpression(type) }
		}

		case TypeKind.Object: {
			return {
				kind: ExpressionKind.ObjectType,
				entries: [ ...type.properties ]
					.map(([ name, type ]) => ({ kind: ExpressionKind.ObjectEntry, name, type: typeToExpression(type) }))
			}
		}

		case TypeKind.Function: {
			return {
				kind: ExpressionKind.FunctionType,
				parameters: type.parameters.map(type => typeToExpression(type)),
				returnType: typeToExpression(type.returnType)
			}
		}

		case TypeKind.Any:
			return { kind: ExpressionKind.Any }
	}
}

export default typeToExpression
