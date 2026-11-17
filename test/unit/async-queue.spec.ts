import { AsyncQueue } from '../../src/utils/async-queue'
import { sleepMillis } from '../../src/utils/sleep'

describe('AsyncQueue', () => {
  const delayedTask = (log: string[], id: number, active: { now: number; peak: number }) => async () => {
    active.now++
    active.peak = Math.max(active.peak, active.now)
    await sleepMillis(5)
    log.push(`done ${id}`)
    active.now--
  }

  test('runs at most `concurrency` tasks at once and drains all of them', async () => {
    const log: string[] = []
    const active = { now: 0, peak: 0 }
    const queue = new AsyncQueue(2, 2)

    for (let i = 0; i < 6; i++) {
      await queue.enqueue(delayedTask(log, i, active))
    }
    await queue.drain()

    expect(active.peak).toBe(2)
    expect(log).toHaveLength(6)
  })

  test('rejects a second waiting enqueue while the queue is full', async () => {
    const queue = new AsyncQueue(1, 1)
    const active = { now: 0, peak: 0 }
    await queue.enqueue(delayedTask([], 0, active))
    await queue.enqueue(delayedTask([], 1, active))
    const waiting = queue.enqueue(delayedTask([], 2, active))

    await expect(queue.enqueue(delayedTask([], 3, active))).rejects.toThrow('Queue capacity is full')
    await waiting
    await queue.drain()
  })

  test('rejects a second concurrent drain', async () => {
    const queue = new AsyncQueue(1, 1)
    await queue.enqueue(delayedTask([], 0, { now: 0, peak: 0 }))
    const draining = queue.drain()

    await expect(queue.drain()).rejects.toThrow('Already draining')
    await draining
  })

  test('drain resolves immediately when idle', async () => {
    await expect(new AsyncQueue(1, 1).drain()).resolves.toBeUndefined()
  })
})
