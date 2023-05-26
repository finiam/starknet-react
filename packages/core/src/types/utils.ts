// Flatten array into union
export type UnpackedArray<T> = T extends Array<infer U>
  ? U
  : T extends ReadonlyArray<infer U>
  ? U
  : T

// Transform array of anything into same length array of unknowns
export type UnknowArray<T> = {
  [K in keyof T]: unknown
}
