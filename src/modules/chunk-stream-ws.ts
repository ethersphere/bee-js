import { System } from 'cafe-utility'
import WebSocket from 'isomorphic-ws'
import type { BeeRequestOptions, UploadOptions } from '../types'
import { prepareRequestHeaders } from '../utils/headers'
import { BatchId } from '../utils/typed-bytes'

const endpoint = 'chunks/stream'

/**
 * Options for WebSocket chunk upload stream
 */
export interface ChunkStreamOptions {
  /**
   * Maximum number of unacknowledged chunks in flight
   */
  concurrency?: number

  /**
   * Callback for upload progress
   */
  onProgress?: (uploaded: number) => void

  /**
   * Callback for errors
   */
  onError?: (error: Error) => void
}

/**
 * Result of chunk upload via WebSocket
 */
export interface ChunkStreamResult {
  /**
   * Total number of chunks uploaded
   */
  totalChunks: number

  /**
   * Total bytes uploaded
   */
  totalBytes: number
}

/**
 * Creates a WebSocket connection for streaming chunk uploads
 */
export class ChunkUploadStream {
  private ws: WebSocket | null = null
  private queue: Uint8Array[] = []
  private inFlight = 0
  private uploaded = 0
  private totalBytes = 0
  private concurrency: number
  private onProgress?: (uploaded: number) => void
  private onError?: (error: Error) => void
  private resolveClose?: (result: ChunkStreamResult) => void
  private rejectClose?: (error: Error) => void
  private closed = false
  private error: Error | null = null
  private lastAckTime = Date.now()
  private ackCount = 0
  private sendCount = 0

  constructor(
    private baseUrl: string,
    private postageBatchId: BatchId,
    private uploadOptions?: UploadOptions,
    options?: ChunkStreamOptions,
  ) {
    this.concurrency = options?.concurrency ?? 64
    this.onProgress = options?.onProgress
    this.onError = options?.onError
  }

  /**
   * Opens the WebSocket connection
   */
  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.baseUrl.replace(/^http/i, 'ws')
      const headers = prepareRequestHeaders(this.postageBatchId, this.uploadOptions)

      // Build query parameters from upload options
      const params = new URLSearchParams()

      if (this.uploadOptions?.pin) params.append('pin', 'true')
      if (this.uploadOptions?.tag) params.append('tag', this.uploadOptions.tag.toString())
      if (this.uploadOptions?.deferred !== undefined) params.append('deferred', String(this.uploadOptions.deferred))

      const queryString = params.toString()
      const url = queryString ? `${wsUrl}/${endpoint}?${queryString}` : `${wsUrl}/${endpoint}`

      console.log(`[ChunkStream] Opening WebSocket connection to: ${url}`)
      console.log(`[ChunkStream] Headers:`, headers)

      if (System.whereAmI() === 'browser') {
        // Note: browsers don't support custom headers in WebSocket constructor
        // Headers should be passed via query parameters instead
        this.ws = new WebSocket(url)
      } else {
        this.ws = new WebSocket(url, {
          headers: headers as Record<string, string>,
        })
      }

      this.ws.binaryType = 'arraybuffer'

      this.ws.onopen = () => {
        console.log('[ChunkStream] WebSocket connection opened successfully')
        resolve()
      }

      this.ws.onerror = (event: any) => {
        console.error('[ChunkStream] WebSocket error:', event.message || event)
        const error = new Error(`WebSocket error: ${event.message || 'Unknown error'}`)
        this.error = error
        this.onError?.(error)
        reject(error)
      }

      this.ws.onmessage = (event: any) => {
        const now = Date.now()
        const timeSinceLastAck = now - this.lastAckTime
        this.ackCount++

        // Only log every 100 ACKs or if slow
        if (this.ackCount % 100 === 0 || timeSinceLastAck > 1000) {
          console.log(`[ChunkStream] ACK #${this.ackCount}, uploaded: ${this.uploaded + 1}, inFlight: ${this.inFlight - 1}, time since last: ${timeSinceLastAck}ms`)
        }

        this.lastAckTime = now
        this.handleAck(event.data)
      }

      this.ws.onclose = () => {
        console.log('[ChunkStream] WebSocket connection closed, uploaded:', this.uploaded)
        if (this.resolveClose && !this.error) {
          this.resolveClose({
            totalChunks: this.uploaded,
            totalBytes: this.totalBytes,
          })
        } else if (this.rejectClose && this.error) {
          this.rejectClose(this.error)
        }
      }
    })
  }

  /**
   * Uploads a chunk via the WebSocket stream
   */
  async uploadChunk(chunk: Uint8Array): Promise<void> {
    if (this.closed) {
      throw new Error('Stream is closed')
    }

    if (this.error) {
      throw this.error
    }

    // Wait if queue is too large (backpressure)
    // This prevents memory exhaustion from queueing thousands of chunks
    const maxQueueSize = this.concurrency * 10 // Allow queue to be 10x concurrency
    while (this.queue.length >= maxQueueSize && !this.error && !this.closed) {
      console.log(`[ChunkStream] Queue full (${this.queue.length}/${maxQueueSize}), waiting for ACKs...`)
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    if (this.error) {
      throw this.error
    }

    this.queue.push(chunk)
    this.totalBytes += chunk.length
    await this.processQueue()
  }

  /**
   * Closes the stream and waits for all chunks to be acknowledged
   */
  async close(): Promise<ChunkStreamResult> {
    if (this.closed) {
      throw new Error('Stream is already closed')
    }

    this.closed = true

    // Wait for all in-flight chunks to be acknowledged
    while (this.inFlight > 0 || this.queue.length > 0) {
      await this.processQueue()
      if (this.inFlight > 0) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }

    return new Promise((resolve, reject) => {
      this.resolveClose = resolve
      this.rejectClose = reject

      if (this.ws) {
        this.ws.close()
      } else {
        resolve({
          totalChunks: this.uploaded,
          totalBytes: this.totalBytes,
        })
      }
    })
  }

  /**
   * Processes the queue and sends chunks when under concurrency limit
   */
  private async processQueue(): Promise<void> {
    let sent = 0
    while (this.queue.length > 0 && this.inFlight < this.concurrency && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const chunk = this.queue.shift()!
      this.inFlight++
      sent++
      this.sendCount++

      try {
        this.ws.send(chunk)
      } catch (error) {
        console.error('[ChunkStream] Error sending chunk:', error)
        this.error = error instanceof Error ? error : new Error(String(error))
        this.onError?.(this.error)
        throw this.error
      }
    }

    // Only log every 100 sends to reduce noise
    if (sent > 0 && this.sendCount % 100 === 0) {
      const rate = this.sendCount / ((Date.now() - this.lastAckTime + 1) / 1000)
      console.log(`[ChunkStream] Sent: ${this.sendCount}, ACKs: ${this.ackCount}, inFlight: ${this.inFlight}/${this.concurrency}, queue: ${this.queue.length}`)
    }
  }

  /**
   * Handles acknowledgment from the server
   */
  private handleAck(data: ArrayBuffer): void {
    // According to the API docs, the server sends a binary response (0) for each uploaded chunk
    // However, it appears the server sends an empty binary message as acknowledgment
    const view = new Uint8Array(data)

    // Accept both empty messages and messages with a single 0 byte
    if (view.length === 0 || (view.length === 1 && view[0] === 0)) {
      this.inFlight--
      this.uploaded++
      this.onProgress?.(this.uploaded)

      // Process more chunks from the queue
      this.processQueue().catch(error => {
        this.error = error instanceof Error ? error : new Error(String(error))
        this.onError?.(this.error)
      })
    } else {
      // Unexpected response format
      console.error(`[ChunkStream] Unexpected ACK format: length=${view.length}, value=${view[0]}`)
      const error = new Error(`Unexpected acknowledgment format: length=${view.length}, value=${view[0]}`)
      this.error = error
      this.onError?.(error)
    }
  }
}

/**
 * Helper function to upload multiple chunks via WebSocket stream
 */
export async function uploadChunksViaStream(
  baseUrl: string,
  chunks: Uint8Array[],
  postageBatchId: BatchId,
  uploadOptions?: UploadOptions,
  streamOptions?: ChunkStreamOptions,
): Promise<ChunkStreamResult> {
  const stream = new ChunkUploadStream(baseUrl, postageBatchId, uploadOptions, streamOptions)

  await stream.open()

  for (const chunk of chunks) {
    await stream.uploadChunk(chunk)
  }

  return stream.close()
}
