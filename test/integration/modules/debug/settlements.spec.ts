import * as settlements from '../../../../src/modules/debug/settlements'
import { beeDebugKyOptions, commonMatchers } from '../../../utils'

commonMatchers()

describe('settlements', () => {
  test('all settlements', async () => {
    const response = await settlements.getAllSettlements(beeDebugKyOptions())

    expect(response.totalReceived).toBeNumberString()
    expect(response.totalSent).toBeNumberString()
    expect(Array.isArray(response.settlements)).toBeTruthy()

    if (response.settlements.length > 0) {
      expect(response.settlements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            peer: expect.any(String),
            received: expect.any(String),
            sent: expect.any(String),
          }),
        ]),
      )

      const peerSettlement = response.settlements[0]

      const peerSettlementResponse = await settlements.getSettlements(beeDebugKyOptions(), peerSettlement.peer)

      expect(peerSettlementResponse.peer).toEqual(peerSettlement.peer)
      expect(peerSettlementResponse.received).toBeNumberString()
      expect(peerSettlementResponse.sent).toBeNumberString()
    }
  })
})
