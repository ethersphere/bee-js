import { PassThrough } from 'stream'

export class TarStream {
  output = new PassThrough()
  currentFileSize = 0
  async beginFile(path: string, size: number) {
    const header = createHeader(path, size)
    this.output.write(header)
    this.currentFileSize = 0
  }
  async appendFile(data: Uint8Array) {
    return new Promise<void>(resolve => {
      this.output.write(data, () => {
        resolve()
      })
      this.currentFileSize += data.length
    })
  }
  async endFile() {
    const padding = 512 - (this.currentFileSize % 512)
    this.output.write(Buffer.alloc(padding, 0))
  }
  async end() {
    this.output.write(createEndOfArchive())
    this.output.end()
  }
}

function createHeader(path: string, size: number): Uint8Array {
  const header = Buffer.alloc(512, 0) // Initialize header with zeros
  header.write(path, 0, 100) // File name
  header.write('0000777', 100, 8) // File mode
  header.write('0001750', 108, 8) // UID
  header.write('0001750', 116, 8) // GID
  header.write(size.toString(8).padStart(11, '0') + ' ', 124, 12) // File size
  header.write(Math.floor(new Date().getTime() / 1000).toString(8) + ' ', 136, 12) // Mod time
  header.write('        ', 148, 8) // Checksum placeholder
  header.write('0', 156, 1) // Typeflag
  header.write('ustar  ', 257, 8) // Magic and version
  header.write('0'.repeat(8 * 12), 345, 8 * 12) // Fill remaining with zeros
  const checksum = header.reduce((sum, elem) => sum + elem, 0)
  header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8) // Write checksum

  return header
}

function createEndOfArchive(): Uint8Array {
  return Buffer.alloc(1024, 0)
}
