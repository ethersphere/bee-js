// Copyright 2024 The Swarm Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

import { Binary } from 'cafe-utility'
import { Bytes } from '../utils/bytes'
import { Reference, Span } from '../utils/typed-bytes'
import { calculateChunkAddress } from './bmt'
import { MIN_PAYLOAD_SIZE, MAX_PAYLOAD_SIZE } from './cac'
import { newChunkEncrypter, decryptChunkData, KEY_LENGTH, type Key } from './encryption'

const ENCODER = new TextEncoder()

/**
 * Encrypted chunk interface
 *
 * The reference includes both the chunk address and the encryption key (64 bytes total)
 */
export interface EncryptedChunk {
  readonly data: Uint8Array // encrypted span + encrypted data
  readonly encryptionKey: Key // 32 bytes
  span: Span // original (unencrypted) span
  payload: Bytes // encrypted payload
  address: Reference // BMT hash of encrypted data
  reference: Reference // 64 bytes: address (32) + encryption key (32)
}

/**
 * Creates an encrypted content addressed chunk
 *
 * Process:
 * 1. Create chunk with span + payload
 * 2. Encrypt the chunk data
 * 3. Calculate BMT hash on encrypted data
 * 4. Return reference = address + encryption key (64 bytes)
 *
 * @param payloadBytes the data to be stored in the chunk
 */
export function makeEncryptedContentAddressedChunk(payloadBytes: Uint8Array | string): EncryptedChunk {
  if (!(payloadBytes instanceof Uint8Array)) {
    payloadBytes = ENCODER.encode(payloadBytes)
  }

  if (payloadBytes.length < MIN_PAYLOAD_SIZE || payloadBytes.length > MAX_PAYLOAD_SIZE) {
    throw new RangeError(
      `payload size ${payloadBytes.length} exceeds limits [${MIN_PAYLOAD_SIZE}, ${MAX_PAYLOAD_SIZE}]`,
    )
  }

  // Create the original chunk data (span + payload)
  const span = Span.fromBigInt(BigInt(payloadBytes.length))
  const chunkData = Binary.concatBytes(span.toUint8Array(), payloadBytes)

  // Encrypt the chunk
  const encrypter = newChunkEncrypter()
  const { key, encryptedSpan, encryptedData } = encrypter.encryptChunk(chunkData)

  // Concatenate encrypted span and data
  const encryptedChunkData = Binary.concatBytes(encryptedSpan, encryptedData)

  // Calculate BMT address on encrypted data
  const address = calculateChunkAddress(encryptedChunkData)

  // Create 64-byte reference: address (32 bytes) + encryption key (32 bytes)
  const reference = new Reference(Binary.concatBytes(address.toUint8Array(), key))

  return {
    data: encryptedChunkData,
    encryptionKey: key,
    span,
    payload: new Bytes(encryptedChunkData.slice(Span.LENGTH)),
    address,
    reference,
  }
}

/**
 * Decrypts an encrypted chunk given the encryption key
 *
 * @param encryptedChunkData The encrypted chunk data (span + payload)
 * @param encryptionKey The 32-byte encryption key
 */
export function decryptEncryptedChunk(encryptedChunkData: Uint8Array, encryptionKey: Key): Uint8Array {
  return decryptChunkData(encryptionKey, encryptedChunkData)
}

/**
 * Extracts encryption key from a 64-byte encrypted reference
 *
 * @param reference 64-byte reference (address + key)
 */
export function extractEncryptionKey(reference: Reference): Key {
  const refBytes = reference.toUint8Array()
  if (refBytes.length !== 64) {
    throw new Error(`Invalid encrypted reference length: ${refBytes.length}, expected 64`)
  }

  return refBytes.slice(32, 64)
}

/**
 * Extracts the chunk address from a 64-byte encrypted reference
 *
 * @param reference 64-byte reference (address + key)
 */
export function extractChunkAddress(reference: Reference): Reference {
  const refBytes = reference.toUint8Array()
  if (refBytes.length !== 64) {
    throw new Error(`Invalid encrypted reference length: ${refBytes.length}, expected 64`)
  }

  return new Reference(refBytes.slice(0, 32))
}
