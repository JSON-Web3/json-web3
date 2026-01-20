export const BIGINT_TAG = '__@json.bigint__'
export const TYPEDARRAY_TAG = '__@json.typedarray__'

export const undefined = void 0
export const isUndefined = (value: any): value is undefined => typeof value === 'undefined'
export const isString = (value: any): value is string => typeof value === 'string'
export const hasOwnProperty = (obj: any, prop: string): boolean =>
  Object.prototype.hasOwnProperty.call(obj, prop)
export const isArray = (value: any): value is Array<any> => Array.isArray(value)
export const isObject = (value: any): value is Record<string, any> =>
  value !== null && typeof value === 'object' && !isArray(value)
export const isFunction = (value: any): value is Function => typeof value === 'function'
export const isBigInt = (value: any): value is bigint => typeof value === 'bigint'
const hasBuffer = (): boolean => typeof Buffer !== 'undefined'

export const isBuffer = (value: any): value is Buffer =>
  hasBuffer() && isFunction(Buffer.isBuffer) && Buffer.isBuffer(value)
export const isArrayBuffer = (value: any): value is ArrayBuffer =>
  !isUndefined(ArrayBuffer) && value instanceof ArrayBuffer

export const isTypedArray = (value: any): value is ArrayBufferView => {
  if (isUndefined(value)) return false
  if (!isUndefined(ArrayBuffer) && isFunction(ArrayBuffer.isView) && ArrayBuffer.isView(value)) {
    return Object.prototype.toString.call(value) !== '[object DataView]'
  }
  const tag = Object.prototype.toString.call(value)
  return tag.endsWith('Array]') && tag !== '[object Array]'
}

export const getTypedArrayName = (value: any): string | null => {
  if (isUndefined(value)) return null
  const ctor = (value as any).constructor
  if (ctor && isString(ctor.name)) return ctor.name
  const tag = Object.prototype.toString.call(value)
  const match = /^\[object (.+)\]$/.exec(tag)
  return match ? match[1] : null
}

const TYPEDARRAY_CTORS: Record<string, any> = {
  Uint8Array: !isUndefined(Uint8Array) ? Uint8Array : undefined,
  Uint8ClampedArray: !isUndefined(Uint8ClampedArray) ? Uint8ClampedArray : undefined,
  Uint16Array: !isUndefined(Uint16Array) ? Uint16Array : undefined,
  Uint32Array: !isUndefined(Uint32Array) ? Uint32Array : undefined,
  Int8Array: !isUndefined(Int8Array) ? Int8Array : undefined,
  Int16Array: !isUndefined(Int16Array) ? Int16Array : undefined,
  Int32Array: !isUndefined(Int32Array) ? Int32Array : undefined,
  Float32Array: !isUndefined(Float32Array) ? Float32Array : undefined,
  Float64Array: !isUndefined(Float64Array) ? Float64Array : undefined,
  BigInt64Array: !isUndefined(BigInt64Array) ? BigInt64Array : undefined,
  BigUint64Array: !isUndefined(BigUint64Array) ? BigUint64Array : undefined,
}

export const toHex = (value: Uint8Array): string => {
  let out = '0x'
  for (const byte of value) {
    out += byte.toString(16).padStart(2, '0')
  }
  return out
}

export const fromHex = (hex: string): Uint8Array => {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex
  if (normalized.length % 2 !== 0) {
    throw new Error('Invalid hex string for bytes')
  }

  if (hasBuffer()) {
    return Uint8Array.from(Buffer.from(normalized, 'hex'))
  }

  const out = new Uint8Array(normalized.length / 2)
  for (let i = 0; i < normalized.length; i += 2) {
    out[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16)
  }
  return out
}

export const toSerializable = (value: any): any => {
  if (isBigInt(value)) {
    return { [BIGINT_TAG]: value.toString() }
  }

  if (isTypedArray(value)) {
    const type = getTypedArrayName(value)
    if (type && TYPEDARRAY_CTORS[type]) {
      const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
      return { [TYPEDARRAY_TAG]: { type, bytes: toHex(bytes) } }
    }
  }

  if (isArrayBuffer(value)) {
    return { [TYPEDARRAY_TAG]: { type: 'Uint8Array', bytes: toHex(new Uint8Array(value)) } }
  }

  if (
    value &&
    isObject(value) &&
    value.type === 'Buffer' &&
    isArray(value.data) &&
    Object.keys(value).length === 2 &&
    value.data.every((entry: any) => Number.isInteger(entry) && entry >= 0 && entry <= 255)
  ) {
    return { [TYPEDARRAY_TAG]: { type: 'Uint8Array', bytes: toHex(Uint8Array.from(value.data)) } }
  }

  return value
}

export const fromSerializable = (value: any): any => {
  if (value && isObject(value)) {
    if (hasOwnProperty(value, BIGINT_TAG)) {
      return BigInt(value[BIGINT_TAG])
    }
    if (hasOwnProperty(value, TYPEDARRAY_TAG)) {
      const payload = value[TYPEDARRAY_TAG]
      if (!payload || !isObject(payload) || !isString(payload.type) || !isString(payload.bytes)) {
        throw new Error('Invalid typed array payload')
      }
      const bytes = fromHex(payload.bytes)
      const ctor = TYPEDARRAY_CTORS[payload.type]
      if (!ctor) return bytes
      const buffer = new ArrayBuffer(bytes.byteLength)
      new Uint8Array(buffer).set(bytes)
      return new ctor(buffer)
    }
    if (
      value.type === 'Buffer' &&
      isArray(value.data) &&
      Object.keys(value).length === 2 &&
      value.data.every((entry: any) => Number.isInteger(entry) && entry >= 0 && entry <= 255)
    ) {
      return Uint8Array.from(value.data)
    }
  }
  return value
}

export const isTypedArrayPayload = (value: any): boolean =>
  isObject(value) &&
  isString(value.type) &&
  isString(value.bytes) &&
  Object.keys(value).length === 2
