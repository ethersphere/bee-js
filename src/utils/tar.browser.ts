export class TarStream {
  pieces = [] as Uint8Array[]
  currentFileSize = 0

  get output() {
    return this.pieces.reduce((acc, piece) => {
      const newAcc = new Uint8Array(acc.length + piece.length)
      newAcc.set(acc)
      newAcc.set(piece, acc.length)

      return newAcc
    })
  }

  beginFile(path: string, size: number) {
    if (path.length > 100) {
      throw new Error(`File name too long: ${path}`)
    }
    const header = createHeader(path, size)
    this.pieces.push(header)
    this.currentFileSize = 0
  }

  async appendFile(data: Uint8Array) {
    this.pieces.push(data)
    this.currentFileSize += data.length
  }

  async endFile() {
    const padding = this.currentFileSize % 512 === 0 ? 0 : 512 - (this.currentFileSize % 512)

    if (padding > 0) {
      this.pieces.push(new Uint8Array(padding))
    }
  }

  async end() {
    this.pieces.push(createEndOfArchive())
  }
}

function createHeader(path: string, size: number): Uint8Array {
  const encoder = new TextEncoder()

  function writeToBuffer(str: string, offset: number, length: number) {
    const bytes = encoder.encode(str)
    header.set(bytes.slice(0, length), offset)
  }

  // Initialize header with zeros
  const header = new Uint8Array(512)
  header.fill(0, 0, 512)

  // File name, truncated to 100 characters if necessary
  writeToBuffer(path.slice(0, 100).padEnd(100, '\0'), 0, 100)

  // File mode (octal) and null-terminated
  writeToBuffer('0000777\0', 100, 8)

  // UID and GID (octal) and null-terminated
  writeToBuffer('0001750\0', 108, 8) // UID
  writeToBuffer('0001750\0', 116, 8) // GID

  // File size in octal (11 chars) and null-terminated
  writeToBuffer(size.toString(8).padStart(11, '0') + '\0', 124, 12)

  // Modification time in octal and null-terminated
  const modTime = Math.floor(new Date().getTime() / 1000)
  writeToBuffer(modTime.toString(8).padStart(11, '0') + '\0', 136, 12)

  // Checksum placeholder (8 spaces)
  writeToBuffer('        ', 148, 8)

  // Typeflag (normal file)
  writeToBuffer('0', 156, 1)

  // USTAR magic and version
  writeToBuffer('ustar\0\0', 257, 8)

  // Calculate checksum
  let checksum = 0
  for (let i = 0; i < 512; i++) {
    checksum += header[i]
  }

  writeToBuffer(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8)

  return header
}

function createEndOfArchive(): Uint8Array {
  return new Uint8Array(1024)
}
