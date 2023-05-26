export type AbiFunction = {
  name: string
  type: string
  outputs: readonly {
    name: string
    type: string
  }[]
  inputs: readonly {
    name: string
    type: string
  }[]
}
export type ModAbi = readonly (AbiFunction | any)[]

export type UnpackedArray<T> = T extends Array<infer U>
  ? U
  : T extends ReadonlyArray<infer U>
  ? U
  : T

export type ExtractFunctionOutput<TAbi extends ModAbi, name extends string> = Extract<
  UnpackedArray<TAbi>,
  { name: name }
>['outputs']

export type ExtractFunctionInputs<TAbi extends ModAbi, name extends string> = Extract<
  UnpackedArray<TAbi>,
  { name: name }
>['inputs']

export type ExtractFunctionNames<TAbi extends ModAbi> = Extract<
  UnpackedArray<TAbi>,
  { type: 'function'; stateMutability: 'view' }
>['name']

export type ExtractFunctionOutputNames<TOutput extends AbiFunction['outputs']> = {
  [K in keyof TOutput]: TOutput[K]['name']
}

export type FunctionReturnObject<TAbi extends ModAbi, name extends string> = Record<
  ExtractFunctionOutputNames<ExtractFunctionOutput<TAbi, name>>[number],
  unknown
>

export type LengthOfArgs<T> = {
  [K in keyof T]: unknown
}
