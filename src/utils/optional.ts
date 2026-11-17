import { BeeError } from './error.js'

export class Optional<T> {
  private constructor(public value: T | null | undefined) {}

  static of<U>(value: U | null | undefined): Optional<U> {
    return new Optional(value)
  }

  static empty<U>(): Optional<U> {
    return new Optional<U>(null)
  }

  private isPresent(value: T | null | undefined): value is T {
    return value !== null && value !== undefined
  }

  map<K>(fn: (value: T) => K): Optional<K> {
    return new Optional(this.isPresent(this.value) ? fn(this.value) : null)
  }

  async mapAsync<K>(fn: (value: T) => Promise<K>): Promise<Optional<K>> {
    return this.isPresent(this.value) ? Optional.of(await fn(this.value)) : Optional.empty()
  }

  ifPresent(fn: (value: T) => void): this {
    if (this.isPresent(this.value)) {
      fn(this.value)
    }

    return this
  }

  async ifPresentAsync(fn: (value: T) => Promise<void>): Promise<this> {
    if (this.isPresent(this.value)) {
      await fn(this.value)
    }

    return this
  }

  ifAbsent(fn: () => void): this {
    if (!this.isPresent(this.value)) {
      fn()
    }

    return this
  }

  async ifAbsentAsync(fn: () => Promise<void>): Promise<this> {
    if (!this.isPresent(this.value)) {
      await fn()
    }

    return this
  }

  getOrFallback(fn: () => T): T {
    return this.value ?? fn()
  }

  async getOrFallbackAsync(fn: () => Promise<T>): Promise<T> {
    return this.isPresent(this.value) ? this.value : fn()
  }

  getOrThrow(): T {
    if (!this.isPresent(this.value)) {
      throw new BeeError('Optional.value is empty')
    }

    return this.value
  }
}
