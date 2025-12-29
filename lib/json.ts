export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const isPlainObject = (value: object): value is Record<string, unknown> => {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

export const toJsonValue = (value: unknown): JsonValue => {
  if (value === null) {
    return null;
  }

  const valueType = typeof value;

  if (valueType === "string" || valueType === "boolean") {
    return value;
  }

  if (valueType === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Non-finite numbers are not JSON-serializable.");
    }
    return value;
  }

  if (valueType === "undefined") {
    throw new TypeError("Undefined values are not JSON-serializable.");
  }

  if (valueType === "bigint" || valueType === "symbol" || valueType === "function") {
    throw new TypeError("Unsupported JSON value type.");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toJsonValue(entry));
  }

  if (valueType === "object") {
    if (!isPlainObject(value)) {
      throw new TypeError("Only plain objects can be serialized to JSON.");
    }

    const result: Record<string, JsonValue> = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry === undefined) {
        throw new TypeError("Undefined values are not JSON-serializable.");
      }
      result[key] = toJsonValue(entry);
    }
    return result;
  }

  throw new TypeError("Unsupported JSON value type.");
};
