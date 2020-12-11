import { Collection } from "../types"
import Tar from 'tar-js'

export async function makeTar(data: Collection<Uint8Array>): Promise<Uint8Array> {
  const tar = new Tar()
  for (const entry of data) {
    await new Promise<Uint8Array>(resolve =>
      tar.append(
        entry.path,
        entry.data,
        undefined,
        (callback: Uint8Array) => resolve(callback),
      )
    )
  }
  return tar.out
}
