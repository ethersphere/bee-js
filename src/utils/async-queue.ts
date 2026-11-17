import { BeeError } from './error.js'

export class AsyncQueue {
  private readonly queue: (() => Promise<void>)[] = []
  private running = 0
  private onProcessed: (() => void) | null = null
  private onDrained: (() => void) | null = null

  constructor(
    private readonly concurrency: number,
    private readonly capacity: number,
  ) {}

  async enqueue(task: () => Promise<void>): Promise<void> {
    if (this.queue.length < this.capacity) {
      this.push(task)

      return
    }

    if (this.onProcessed) {
      throw new BeeError('Queue capacity is full')
    }

    return new Promise(resolve => {
      this.onProcessed = () => {
        if (this.queue.length < this.capacity) {
          this.onProcessed = null
          this.push(task)
          resolve()
        }
      }
    })
  }

  async drain(): Promise<void> {
    if (this.running === 0) {
      return
    }

    if (this.onDrained) {
      throw new BeeError('Already draining')
    }

    return new Promise(resolve => {
      this.onDrained = () => {
        this.onDrained = null
        resolve()
      }
    })
  }

  private push(task: () => Promise<void>): void {
    this.queue.push(task)
    this.process()
  }

  private process(): void {
    const task = this.running < this.concurrency ? this.queue.shift() : undefined

    if (!task) {
      return
    }
    this.running++
    void task().finally(() => {
      this.running--
      this.process()
      this.onProcessed?.()

      if (this.running === 0) {
        this.onDrained?.()
      }
    })
  }
}
