import { z } from 'zod'
import { Reference } from './typed-bytes'

export class ResourceLocator {
  constructor(private raw: Reference | Uint8Array | string) {}

  toString() {
    const asString = z.string().safeParse(this.raw)

    if (asString.success && asString.data.includes('.eth')) {
      return asString.data
    }

    return new Reference(this.raw).toHex()
  }
}
