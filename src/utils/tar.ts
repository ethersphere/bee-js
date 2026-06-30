import { PassThrough } from 'stream'

export class TarStream {
  output = new PassThrough()
  currentFileSize = 0

  beginFile(path: string, size: number) {
    const { name, prefix, longLink } = splitPath(path)

    if (longLink) {
      const pathData = Buffer.from(path + '\0')
      this.output.write(createLongLinkHeader(pathData.length))
      this.output.write(pathData)
      const padding = pathData.length % 512 === 0 ? 0 : 512 - (pathData.length % 512)

      if (padding > 0) this.output.write(Buffer.alloc(padding, 0))
    }
    const header = createHeader(name, prefix, size)
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

function splitPath(path: string): { name: string; prefix: string; longLink: boolean } {
  if (path.length <= 100) return { name: path, prefix: '', longLink: false }
  for (let i = path.length - 1; i >= 0; i--) {
    if (path[i] === '/') {
      const name = path.substring(i + 1)
      const prefix = path.substring(0, i)

      if (name.length <= 100 && prefix.length <= 155) return { name, prefix, longLink: false }
    }
  }
  // Filename itself is > 100 chars or path > 255 chars — use GNU LongLink
  const lastSlash = path.lastIndexOf('/')
  const truncatedName = (lastSlash >= 0 ? path.substring(lastSlash + 1) : path).slice(0, 100)

  return { name: truncatedName, prefix: '', longLink: true }
}

function createLongLinkHeader(size: number): Buffer {
  const header = Buffer.alloc(512, 0)
  header.write('././@LongLink', 0, 100)
  header.write('0000644\0', 100, 8)
  header.write('0000000\0', 108, 8)
  header.write('0000000\0', 116, 8)
  header.write(size.toString(8).padStart(11, '0') + '\0', 124, 12)
  header.write('00000000000\0', 136, 12)
  header.write('        ', 148, 8)
  header.write('L', 156, 1)
  header.write('ustar\0\0', 257, 8)
  let checksum = 0
  for (let i = 0; i < 512; i++) checksum += header[i]
  header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8)

  return header
}

function createHeader(name: string, prefix: string, size: number): Buffer {
  // Initialize header with zeros
  const header = Buffer.alloc(512, 0)

  // File name, truncated to 100 characters if necessary
  header.write(name.slice(0, 100).padEnd(100, '\0'), 0, 100)

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

  // UStar prefix field (offset 345, 155 bytes) — used when path > 100 but fits split
  if (prefix) header.write(prefix.slice(0, 155).padEnd(155, '\0'), 345, 155)

  // Calculate checksum
  let checksum = 0
  for (let i = 0; i < 512; i++) checksum += header[i]
  header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8)

  return header
}

function createEndOfArchive(): Uint8Array {
  return Buffer.alloc(1024, 0)
}
