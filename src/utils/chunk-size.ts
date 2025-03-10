export function totalChunks(fileSize: number) {
  const chunkSize = 4096
  const hashesPerChunk = 128

  function chunksAtLevel(chunkCount: number): number {
    if (chunkCount <= 1) {
      return chunkCount
    }
    const upperLevelChunks = Math.ceil(chunkCount / hashesPerChunk)

    return chunkCount + chunksAtLevel(upperLevelChunks)
  }

  const baseLevelChunks = Math.ceil(fileSize / chunkSize)

  return chunksAtLevel(baseLevelChunks)
}
