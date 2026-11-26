import { deepMerge2, deepMerge3, getDeep } from '../../src/utils/object'

describe('object utils', () => {
  test('deepMerge3 merges nested objects with later sources winning', () => {
    expect(deepMerge3({ a: 1, h: { x: '1' } }, { h: { y: '2' } }, { a: 2 })).toEqual({
      a: 2,
      h: { x: '1', y: '2' },
    })
  })

  test('deepMerge2 keeps existing values when the source value is nullish', () => {
    expect(deepMerge2({ a: 1, b: 2 }, { a: undefined, b: null })).toEqual({ a: 1, b: 2 })
  })

  test('deepMerge2 copies arrays instead of sharing them', () => {
    const source = { list: [1, 2] }
    const merged = deepMerge2({}, source)

    expect(merged.list).toEqual([1, 2])
    expect(merged.list).not.toBe(source.list)
  })

  test('deepMerge2 keeps AbortSignal and Uint8Array by reference', () => {
    const signal = new AbortController().signal
    const bytes = new Uint8Array([1])
    const merged = deepMerge2({}, { signal, bytes })

    expect(merged.signal).toBe(signal)
    expect(merged.bytes).toBe(bytes)
  })

  test('deepMerge2 does not mutate its inputs', () => {
    const target = { h: { x: '1' } }
    deepMerge2(target, { h: { y: '2' } })

    expect(target).toEqual({ h: { x: '1' } })
  })

  test('getDeep reads nested paths and returns null for missing ones', () => {
    expect(getDeep({ a: { b: 0 } }, 'a.b')).toBe(0)
    expect(getDeep({ a: {} }, 'a.b.c')).toBeNull()
    expect(getDeep(undefined, 'status')).toBeNull()
  })
})
