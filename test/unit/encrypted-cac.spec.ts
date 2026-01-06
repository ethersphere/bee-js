import {
  makeEncryptedContentAddressedChunk,
  decryptEncryptedChunk,
  extractEncryptionKey,
  extractChunkAddress,
} from '../../src/chunk/encrypted-cac'
import { Span } from '../../src/utils/typed-bytes'

describe('encrypted-cac', () => {
  describe('makeEncryptedContentAddressedChunk', () => {
    test('should create encrypted chunk from string', () => {
      const payload = 'Hello, Swarm!'
      const chunk = makeEncryptedContentAddressedChunk(payload)

      expect(chunk.encryptionKey.length).toBe(32)
      expect(chunk.reference.toUint8Array().length).toBe(64)
      expect(chunk.address.toUint8Array().length).toBe(32)
      expect(chunk.data.length).toBe(8 + 4096) // encrypted span + padded encrypted data
    })

    test('should create encrypted chunk from Uint8Array', () => {
      const payload = new Uint8Array([1, 2, 3, 4, 5])
      const chunk = makeEncryptedContentAddressedChunk(payload)

      expect(chunk.encryptionKey.length).toBe(32)
      expect(chunk.reference.toUint8Array().length).toBe(64)
      expect(chunk.span.toBigInt()).toBe(5n)
    })

    test('should throw error for empty payload', () => {
      expect(() => makeEncryptedContentAddressedChunk(new Uint8Array(0))).toThrow('payload size 0 exceeds limits')
    })

    test('should throw error for oversized payload', () => {
      const largePayload = new Uint8Array(4097)
      expect(() => makeEncryptedContentAddressedChunk(largePayload)).toThrow('payload size 4097 exceeds limits')
    })

    test('should produce different keys for same payload', () => {
      const payload = 'Hello, Swarm!'
      const chunk1 = makeEncryptedContentAddressedChunk(payload)
      const chunk2 = makeEncryptedContentAddressedChunk(payload)

      expect(chunk1.encryptionKey).not.toEqual(chunk2.encryptionKey)
      expect(chunk1.reference).not.toEqual(chunk2.reference)
      expect(chunk1.address).not.toEqual(chunk2.address)
    })

    test('should encrypt data correctly', () => {
      const payload = new Uint8Array([1, 2, 3, 4, 5])
      const chunk = makeEncryptedContentAddressedChunk(payload)

      // Encrypted data should be different from original
      expect(chunk.data).not.toEqual(payload)
    })
  })

  describe('decryptEncryptedChunk', () => {
    test('should decrypt chunk data correctly', () => {
      const originalPayload = 'Hello, Swarm!'
      const chunk = makeEncryptedContentAddressedChunk(originalPayload)

      const decrypted = decryptEncryptedChunk(chunk.data, chunk.encryptionKey)

      // Extract span and payload from decrypted data
      const decryptedSpan = Span.fromSlice(decrypted, 0)
      const payloadLength = Number(decryptedSpan.toBigInt())
      const decryptedPayload = decrypted.slice(8, 8 + payloadLength)

      const decoder = new TextDecoder()
      expect(decoder.decode(decryptedPayload)).toBe(originalPayload)
    })

    test('should decrypt binary data correctly', () => {
      const originalPayload = new Uint8Array([10, 20, 30, 40, 50])
      const chunk = makeEncryptedContentAddressedChunk(originalPayload)

      const decrypted = decryptEncryptedChunk(chunk.data, chunk.encryptionKey)

      const decryptedSpan = Span.fromSlice(decrypted, 0)
      const payloadLength = Number(decryptedSpan.toBigInt())
      const decryptedPayload = decrypted.slice(8, 8 + payloadLength)

      expect(decryptedPayload).toEqual(originalPayload)
    })

    test('should handle maximum payload size', () => {
      const maxPayload = new Uint8Array(4096)
      crypto.getRandomValues(maxPayload)

      const chunk = makeEncryptedContentAddressedChunk(maxPayload)
      const decrypted = decryptEncryptedChunk(chunk.data, chunk.encryptionKey)

      const decryptedSpan = Span.fromSlice(decrypted, 0)
      const payloadLength = Number(decryptedSpan.toBigInt())
      const decryptedPayload = decrypted.slice(8, 8 + payloadLength)

      expect(decryptedPayload).toEqual(maxPayload)
    })
  })

  describe('extractEncryptionKey', () => {
    test('should extract encryption key from reference', () => {
      const payload = 'Hello, Swarm!'
      const chunk = makeEncryptedContentAddressedChunk(payload)

      const extractedKey = extractEncryptionKey(chunk.reference)

      expect(extractedKey).toEqual(chunk.encryptionKey)
    })

    test('should throw error for invalid reference length', () => {
      const invalidRef = new Uint8Array(32) // Only 32 bytes instead of 64
      const { Reference } = require('../../src/utils/typed-bytes')
      const ref = new Reference(invalidRef)

      expect(() => extractEncryptionKey(ref)).toThrow('Invalid encrypted reference length: 32, expected 64')
    })
  })

  describe('extractChunkAddress', () => {
    test('should extract chunk address from reference', () => {
      const payload = 'Hello, Swarm!'
      const chunk = makeEncryptedContentAddressedChunk(payload)

      const extractedAddress = extractChunkAddress(chunk.reference)

      expect(extractedAddress.toUint8Array()).toEqual(chunk.address.toUint8Array())
    })

    test('should throw error for invalid reference length', () => {
      const invalidRef = new Uint8Array(32)
      const { Reference } = require('../../src/utils/typed-bytes')
      const ref = new Reference(invalidRef)

      expect(() => extractChunkAddress(ref)).toThrow('Invalid encrypted reference length: 32, expected 64')
    })
  })

  describe('encryption/decryption round trip', () => {
    test('should successfully round trip various payloads', () => {
      const testPayloads = [
        'Hello, World!',
        'A',
        'x'.repeat(4096), // maximum size
        'The quick brown fox jumps over the lazy dog',
        '\u{1F4A9}\u{1F680}\u{1F525}', // emojis
      ]

      testPayloads.forEach(originalPayload => {
        const chunk = makeEncryptedContentAddressedChunk(originalPayload)
        const decrypted = decryptEncryptedChunk(chunk.data, chunk.encryptionKey)

        const decryptedSpan = Span.fromSlice(decrypted, 0)
        const payloadLength = Number(decryptedSpan.toBigInt())
        const decryptedPayload = decrypted.slice(8, 8 + payloadLength)

        const decoder = new TextDecoder()
        expect(decoder.decode(decryptedPayload)).toBe(originalPayload)
      })
    })
  })
})
