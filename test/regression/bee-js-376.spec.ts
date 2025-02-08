import { Types } from 'cafe-utility'
import { BeeRequest, BeeRequestOptions } from '../../src'
import { batch, makeBee } from '../utils'

test('bee-js/376 - Hooks: explicit undefined values in params', async () => {
  const bee = makeBee()

  let runs = 0

  const requestOptions: BeeRequestOptions = {
    onRequest: (request: BeeRequest) => {
      const params = Types.asObject(request.params)
      expect(Object.keys(params)).toHaveLength(0)

      runs++
    },
  }

  await bee.uploadFile(batch(), 'EOF', undefined, undefined, requestOptions)

  expect(runs).toBe(1)
})
