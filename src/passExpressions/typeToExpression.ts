import { Type, TypeKind } from "."
import { Node, NodeKind } from "../parse"

export function typeToExpression(type: Type): Node.Expression {
	switch (type.kind) {
		case TypeKind.Null:
			return { kind: NodeKind.Null }

		case TypeKind.True:
			return { kind: NodeKind.True }

		case TypeKind.False:
			return { kind: NodeKind.False }

		case TypeKind.UnsignedInteger:
			return { kind: NodeKind.UnsignedIntegerType, bits: type.bits }

		case TypeKind.SignedInteger:
			return { kind: NodeKind.SignedIntegerType, bits: type.bits }

		case TypeKind.Float16:
			return { kind: NodeKind.Float16Type }

		case TypeKind.Float32:
			return { kind: NodeKind.Float32Type }

		case TypeKind.Float64:
			return { kind: NodeKind.Float64Type }

		case TypeKind.Float128:
			return { kind: NodeKind.Float128Type }

		case TypeKind.Union: {
			if (type.members.length == 2) {
				return {
					kind: NodeKind.Or,
					left: typeToExpression(type.members[0]!),
					right: typeToExpression(type.members[1]!)
				}
			}

			return { kind: NodeKind.Or, right: typeToExpression(type.members.pop()!), left: typeToExpression(type) }
		}

		case TypeKind.Object: {
			return {
				kind: NodeKind.ObjectType,
				entries: [ ...type.properties ]
					.map(([ name, type ]) => ({ kind: NodeKind.ObjectEntry, name, type: typeToExpression(type) }))
			}
		}

		case TypeKind.Function: {
			return {
				kind: NodeKind.FunctionType,
				parameters: type.parameters.map(type => typeToExpression(type)),
				returnType: typeToExpression(type.returnType)
			}
		}

		case TypeKind.Any:
			return { kind: NodeKind.Any }
	}
}

export default typeToExpression
