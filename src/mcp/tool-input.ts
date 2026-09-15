import type { StandardSchemaWithJSON } from "@modelcontextprotocol/server";
import { JSONSchema, Schema } from "effect";

const rootRef = "#/$defs/";

const emptyObject = {
  additionalProperties: false,
  properties: {},
  type: "object",
} as const;

const isRootRef = (
  root: JSONSchema.JsonSchema7Root
): root is JSONSchema.JsonSchema7Ref & {
  $schema?: string;
  $defs?: Record<string, JSONSchema.JsonSchema7>;
} => "$ref" in root;

const inlineRoot = (
  source: JSONSchema.JsonSchema7Root
): Record<string, unknown> => {
  const { $defs, $schema, ...rest } = source;
  if (!(isRootRef(source) && $defs)) {
    return rest;
  }
  const { [source.$ref.slice(rootRef.length)]: root, ...shared } = $defs;
  return Object.keys(shared).length > 0
    ? { ...root, $defs: shared }
    : { ...root };
};

export const toolInput = <A, I>(
  schema: Schema.Schema<A, I, never> & { readonly fields: object }
): StandardSchemaWithJSON<I, A> => {
  const standard = Schema.standardSchemaV1(schema);
  const jsonSchema =
    Object.keys(schema.fields).length === 0
      ? emptyObject
      : inlineRoot(JSONSchema.make(schema));
  return {
    "~standard": {
      ...standard["~standard"],
      jsonSchema: { input: () => jsonSchema, output: () => jsonSchema },
    },
  };
};
