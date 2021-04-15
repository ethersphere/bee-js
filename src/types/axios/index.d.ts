declare module 'axios/lib/helpers/normalizeHeaderName' {
  export default function (headers: Record<string, unknown>, header: string): void
}

declare module 'axios/lib/utils' {
  import ArrayBufferView = NodeJS.ArrayBufferView

  export function isFormData(data: unknown): boolean
  export function isArrayBuffer(data: unknown): boolean
  export function isBuffer(data: unknown): boolean
  export function isStream(data: unknown): boolean
  export function isFile(data: unknown): boolean
  export function isBlob(data: unknown): boolean
  export function isArrayBufferView(data: unknown): data is ArrayBufferView
  export function isURLSearchParams(data: unknown): data is URLSearchParams
  export function isObject(data: unknown): boolean
  export function isUndefined(data: unknown): boolean
}
