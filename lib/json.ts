export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== "object") return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

export const toJsonValue = (value: unknown): JsonValue => {
  // IMPORTANT: JsonValue does not allow undefined
  if (value === undefined) {
    throw new TypeError("Undefined values are not JSON-serializable.");
  }

  if (value === null) return null;

  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("Non-finite numbers are not JSON-serializable.");
    }
    return value;
  }

  if (typeof value === "bigint" || typeof value === "symbol" || typeof value === "function") {
    throw new TypeError("Unsupported JSON value type.");
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toJsonValue(entry));
  }

  if (typeof value === "object") {
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
