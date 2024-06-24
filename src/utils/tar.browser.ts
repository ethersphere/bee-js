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
  async beginFile(path: string, size: number) {
    const header = createHeader(path, size)
    this.pieces.push(header)
    this.currentFileSize = 0
  }
  async appendFile(data: Uint8Array) {
    this.pieces.push(data)
    this.currentFileSize += data.length
  }
  async endFile() {
    const padding = 512 - (this.currentFileSize % 512)
    this.pieces.push(new Uint8Array(padding))
  }
  async end() {
    this.pieces.push(createEndOfArchive())
  }
}

function createHeader(path: string, size: number): Uint8Array {
  const header = new Uint8Array(512) // Initialize header with zeros
  const encoder = new TextEncoder()

  function writeToBuffer(str: string, offset: number, length: number) {
    const bytes = encoder.encode(str)
    header.set(bytes.slice(0, length), offset)
  }

  writeToBuffer(path, 0, 100) // File name
  writeToBuffer('0000777', 100, 8) // File mode
  writeToBuffer('0001750', 108, 8) // UID
  writeToBuffer('0001750', 116, 8) // GID
  writeToBuffer(size.toString(8).padStart(11, '0') + ' ', 124, 12) // File size
  writeToBuffer(Math.floor(Date.now() / 1000).toString(8) + ' ', 136, 12) // Mod time
  writeToBuffer('        ', 148, 8) // Checksum placeholder
  writeToBuffer('0', 156, 1) // Typeflag
  writeToBuffer('ustar  ', 257, 8) // Magic and version

  for (let i = 345; i < 512; i++) {
    header[i] = 0 // Fill remaining with zeros
  }

  // Calculate checksum
  let checksum = 0
  for (let i = 0; i < 512; i++) {
    checksum += header[i]
  }

  // Write checksum
  writeToBuffer(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8)

  return header
}

function createEndOfArchive(): Uint8Array {
  return new Uint8Array(1024)
}
