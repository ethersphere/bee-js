// Copyright 2024 The Swarm Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

import { Binary } from 'cafe-utility'
import { keccak } from 'hash-wasm'

export const KEY_LENGTH = 32
export const REFERENCE_SIZE = 64

export type Key = Uint8Array

export interface Encrypter {
  key(): Key
  encrypt(data: Uint8Array): Promise<Uint8Array>
}

export interface Decrypter {
  key(): Key
  decrypt(data: Uint8Array): Promise<Uint8Array>
}

export interface EncryptionInterface extends Encrypter, Decrypter {
  reset(): void
}

/**
 * Core encryption class implementing CTR-mode encryption with Keccak256
 * This matches the Go implementation in bee/pkg/encryption/encryption.go
 */
export class Encryption implements EncryptionInterface {
  private readonly encryptionKey: Key
  private readonly keyLen: number
  private readonly padding: number
  private index: number
  private readonly initCtr: number

  constructor(key: Key, padding: number, initCtr: number) {
    this.encryptionKey = key
    this.keyLen = key.length
    this.padding = padding
    this.initCtr = initCtr
    this.index = 0
  }

  key(): Key {
    return this.encryptionKey
  }

  /**
   * Encrypts data with optional padding
   */
  async encrypt(data: Uint8Array): Promise<Uint8Array> {
    const length = data.length
    let outLength = length
    const isFixedPadding = this.padding > 0

    if (isFixedPadding) {
      if (length > this.padding) {
        throw new Error(`data length ${length} longer than padding ${this.padding}`)
      }
      outLength = this.padding
    }

    const out = new Uint8Array(outLength)
    await this.transform(data, out)

    return out
  }

  /**
   * Decrypts data (caller must know original length if padding was used)
   */
  async decrypt(data: Uint8Array): Promise<Uint8Array> {
    const length = data.length

    if (this.padding > 0 && length !== this.padding) {
      throw new Error(`data length ${length} different than padding ${this.padding}`)
    }

    const out = new Uint8Array(length)
    await this.transform(data, out)

    return out
  }

  /**
   * Resets the counter - only safe to call after encryption/decryption is completed
   */
  reset(): void {
    this.index = 0
  }

  /**
   * Transforms data by splitting into key-length segments and encrypting sequentially
   */
  private async transform(input: Uint8Array, out: Uint8Array): Promise<void> {
    const inLength = input.length

    for (let i = 0; i < inLength; i += this.keyLen) {
      const l = Math.min(this.keyLen, inLength - i)
      await this.transcrypt(this.index, input.subarray(i, i + l), out.subarray(i, i + l))
      this.index++
    }

    // Pad the rest if out is longer
    if (out.length > inLength) {
      pad(out.subarray(inLength))
    }
  }

  /**
   * Segment-wise transformation using XOR with Keccak256-derived keys
   * Matches the Go implementation's Transcrypt function
   */
  private async transcrypt(i: number, input: Uint8Array, out: Uint8Array): Promise<void> {
    // First hash: key with counter (initial counter + i)
    const ctrBytes = new Uint8Array(4)
    const view = new DataView(ctrBytes.buffer)
    view.setUint32(0, i + this.initCtr, true) // little-endian

    const keyAndCtr = new Uint8Array(this.encryptionKey.length + 4)
    keyAndCtr.set(this.encryptionKey)
    keyAndCtr.set(ctrBytes, this.encryptionKey.length)
    const ctrHashHex = await keccak(keyAndCtr, 256)
    const ctrHash = Binary.hexToUint8Array(ctrHashHex)

    // Second round of hashing for selective disclosure
    const segmentKeyHex = await keccak(ctrHash, 256)
    const segmentKey = Binary.hexToUint8Array(segmentKeyHex)

    // XOR bytes up to length of input (out must be at least as long)
    const inLength = input.length
    for (let j = 0; j < inLength; j++) {
      out[j] = input[j] ^ segmentKey[j]
    }

    // Insert padding if out is longer
    if (out.length > inLength) {
      pad(out.subarray(inLength))
    }
  }
}

/**
 * Fills buffer with cryptographically secure random data
 * Works in both browser (Web Crypto API) and Node.js environments
 */
function getRandomValues(buffer: Uint8Array): void {
  if (buffer.length === 0) return

  // Use Web Crypto API for secure random bytes
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buffer)
  } else {
    // Fallback for Node.js
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto')
    const randomBytes = nodeCrypto.randomBytes(buffer.length)
    buffer.set(randomBytes)
  }
}

/**
 * Fills buffer with cryptographically secure random data
 */
function pad(buffer: Uint8Array): void {
  getRandomValues(buffer)
}

/**
 * Generates a cryptographically secure random key
 */
export function generateRandomKey(length: number = KEY_LENGTH): Key {
  const key = new Uint8Array(length)
  getRandomValues(key)

  return key
}

/**
 * Creates encryption interface for chunk span (first 8 bytes)
 */
export function newSpanEncryption(key: Key): EncryptionInterface {
  // ChunkSize is typically 4096, so ChunkSize/KeyLength = 128
  const CHUNK_SIZE = 4096

  return new Encryption(key, 0, Math.floor(CHUNK_SIZE / KEY_LENGTH))
}

/**
 * Creates encryption interface for chunk data
 */
export function newDataEncryption(key: Key): EncryptionInterface {
  const CHUNK_SIZE = 4096

  return new Encryption(key, CHUNK_SIZE, 0)
}

export interface ChunkEncrypter {
  encryptChunk(chunkData: Uint8Array): Promise<{
    key: Key
    encryptedSpan: Uint8Array
    encryptedData: Uint8Array
  }>
}

/**
 * Default chunk encrypter implementation
 */
export class DefaultChunkEncrypter implements ChunkEncrypter {
  async encryptChunk(chunkData: Uint8Array): Promise<{
    key: Key
    encryptedSpan: Uint8Array
    encryptedData: Uint8Array
  }> {
    const key = generateRandomKey(KEY_LENGTH)

    // Encrypt span (first 8 bytes)
    const spanEncrypter = newSpanEncryption(key)
    const encryptedSpan = await spanEncrypter.encrypt(chunkData.subarray(0, 8))

    // Encrypt data (remaining bytes)
    const dataEncrypter = newDataEncryption(key)
    const encryptedData = await dataEncrypter.encrypt(chunkData.subarray(8))

    return {
      key,
      encryptedSpan,
      encryptedData,
    }
  }
}

/**
 * Creates a new chunk encrypter
 */
export function newChunkEncrypter(): ChunkEncrypter {
  return new DefaultChunkEncrypter()
}

/**
 * Decrypts encrypted chunk data using the provided encryption key
 */
export async function decryptChunkData(key: Key, encryptedChunkData: Uint8Array): Promise<Uint8Array> {
  // Decrypt span (first 8 bytes)
  const spanDecrypter = newSpanEncryption(key)
  const decryptedSpan = await spanDecrypter.decrypt(encryptedChunkData.subarray(0, 8))

  // Decrypt data (remaining bytes - should be 4096 bytes due to padding)
  const dataDecrypter = newDataEncryption(key)
  const decryptedData = await dataDecrypter.decrypt(encryptedChunkData.subarray(8))

  // Concatenate span and data
  const result = new Uint8Array(8 + decryptedData.length)
  result.set(decryptedSpan)
  result.set(decryptedData, 8)

  return result
}
