import { PassThrough } from 'stream'

export class TarStream {
  output = new PassThrough()
  currentFileSize = 0

  beginFile(path: string, size: number) {
    if (path.length > 100) {
      throw new Error(`File name too long: ${path}`)
    }
    const header = createHeader(path, size)
    this.output.write(header)
    this.currentFileSize = 0
  }

  async appendFile(data: Uint8Array) {
    return new Promise<void>(resolve => {
      if (!this.output.write(data)) {
        this.output.once('drain', () => {
          resolve()
        })
      } else {
        resolve()
      }
      this.currentFileSize += data.length
    })
  }

  async endFile() {
    const padding = this.currentFileSize % 512 === 0 ? 0 : 512 - (this.currentFileSize % 512)

    if (padding > 0) {
      this.output.write(Buffer.alloc(padding, 0))
    }
  }

  async end() {
    return new Promise<void>(resolve => {
      this.output.write(createEndOfArchive())
      this.output.end(() => {
        resolve()
      })
    })
  }
}

function createHeader(path: string, size: number): Uint8Array {
  // Initialize header with zeros
  const header = Buffer.alloc(512, 0)

  // File name, truncated to 100 characters if necessary
  header.write(path.slice(0, 100).padEnd(100, '\0'), 0, 100)

  // File mode (octal) and null-terminated
  header.write('0000777\0', 100, 8)

  // UID and GID (octal) and null-terminated
  header.write('0001750\0', 108, 8) // UID
  header.write('0001750\0', 116, 8) // GID

  // File size in octal (11 chars) and null-terminated
  header.write(size.toString(8).padStart(11, '0') + '\0', 124, 12)

  // Modification time in octal and null-terminated
  const modTime = Math.floor(new Date().getTime() / 1000)
  header.write(modTime.toString(8).padStart(11, '0') + '\0', 136, 12)

  // Checksum placeholder (8 spaces)
  header.write('        ', 148, 8)

  // Typeflag (normal file)
  header.write('0', 156, 1)

  // USTAR magic and version
  header.write('ustar\0\0', 257, 8)

  // Calculate checksum
  let checksum = 0
  for (let i = 0; i < 512; i++) {
    checksum += header[i]
  }

  header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8)

  return header
}

function createEndOfArchive(): Uint8Array {
  return Buffer.alloc(1024, 0)
}
