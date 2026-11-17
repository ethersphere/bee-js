import { Optional } from '../../src/utils/optional'

describe('Optional', () => {
  test('treats null and undefined as empty but keeps falsy values', () => {
    expect(Optional.of(0).getOrThrow()).toBe(0)
    expect(Optional.of('').getOrFallback(() => 'fallback')).toBe('')
    expect(Optional.of<string>(null).getOrFallback(() => 'fallback')).toBe('fallback')
  })

  test('getOrThrow rejects an empty value', () => {
    expect(() => Optional.empty().getOrThrow()).toThrow('Optional.value is empty')
  })

  test('runs ifPresent or ifAbsent depending on the value', () => {
    const calls: string[] = []
    Optional.of(1)
      .ifPresent(value => calls.push(`present ${value}`))
      .ifAbsent(() => calls.push('absent'))
    Optional.empty().ifAbsent(() => calls.push('empty absent'))

    expect(calls).toEqual(['present 1', 'empty absent'])
  })

  test('maps only present values', async () => {
    expect(Optional.of(2).map(value => value * 2).value).toBe(4)
    expect(Optional.empty<number>().map(value => value * 2).value).toBeNull()
    expect((await Optional.of(2).mapAsync(async value => value * 3)).value).toBe(6)
    expect(await Optional.empty<number>().getOrFallbackAsync(async () => 9)).toBe(9)
  })
})
