import { Types } from 'cafe-utility'
import { Reference } from './typed-bytes'

export class ResourceLocator {
  constructor(private raw: Reference | Uint8Array | string) {}

  toString() {
    if (Types.isString(this.raw) && this.raw.includes('.eth')) {
      return this.raw
    }

    return new Reference(this.raw).toHex()
  }
}
