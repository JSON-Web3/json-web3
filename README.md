# json-web3

BigInt-safe JSON serialization and deserialization for Web3 data.

## Install

```bash
pnpm add json-web3
# or
npm i json-web3
# or
yarn add json-web3
```

## Usage

```ts
import jsonWeb3 from 'json-web3'

const payload = {
  balance: 1234567890123456789n,
  decimals: 18n,
  u8Array: new Uint8Array([1, 2, 3, 255]),
  u16Array: new Uint16Array([1, 2, 3, 255]),
  bigIntArray: new BigInt64Array([18446744073709551615n, 2n, 3n, 255n]),
}

const text = jsonWeb3.stringify(payload)
// => {"balance":{"__@json.bigint__":"1234567890123456789"},"decimals":{"__@json.bigint__":"18"},"u8Array":{"__@json.typedarray__":{"type":"Uint8Array","bytes":"0x010203ff"}},"u16Array":{"__@json.typedarray__":{"type":"Uint16Array","bytes":"0x010002000300ff00"}},"bigIntArray":{"__@json.typedarray__":{"type":"BigInt64Array","bytes":"0xffffffffffffffff02000000000000000300000000000000ff00000000000000"}}}

const restored = jsonWeb3.parse(text)
/* => 
  {
    balance: 1234567890123456789n,
    decimals: 18n,
    u8Array: Uint8Array(4) [1, 2, 3, 255]...,
    u16Array: Uint16Array(4)...,
    bigIntArray: BigInt64Array(4)...
  }
*/
```

## API (Fully compatible with native globalThis.JSON)

- `stringify(value, replacer?, space?)`
- `parse(text, reviver?)`

## Notes

`bigint` values are encoded as objects: `{"__@json.bigint__":"<value>"}`. `ArrayBuffer`, Node `Buffer` JSON shapes, and typed arrays are encoded as `{"__@json.typedarray__":{"type":"<Name>","bytes":"0x..."}}` and decoded back to the original typed array (`Uint8Array`, `Uint8ClampedArray`, `Uint16Array`, `Uint32Array`, `Int8Array`, `Int16Array`, `Int32Array`, `Float32Array`, `Float64Array`, `BigInt64Array`, `BigUint64Array`).
