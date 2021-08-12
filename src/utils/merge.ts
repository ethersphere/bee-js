import { isObject } from './type'

/**
 * Function that deep merges objects
 *
 * @copyright https://github.com/sindresorhus/ky/blob/b3c9e88fa49d50150dbb6e6b771b4af56cb40c98/source/utils/merge.ts
 * @licence MIT
 * @param sources
 */
export function deepMerge<T>(...sources: Array<Partial<T> | undefined>): T {
  let returnValue: any = {}

  for (const source of sources) {
    if (Array.isArray(source)) {
      if (!Array.isArray(returnValue)) {
        returnValue = []
      }

      returnValue = [...returnValue, ...source]
    } else if (isObject(source)) {
      // eslint-disable-next-line prefer-const
      for (let [key, value] of Object.entries(source)) {
        if (isObject(value) && key in returnValue) {
          value = deepMerge(returnValue[key], value)
        }

        returnValue = { ...returnValue, [key]: value }
      }
    }
  }

  return returnValue
}
