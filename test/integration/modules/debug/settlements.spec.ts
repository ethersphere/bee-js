import * as settlements from '../../../../src/modules/debug/settlements'
import { beeDebugUrl, commonMatchers } from '../../../utils'

commonMatchers()

describe('settlements', () => {
  test('all settlements', async () => {
    const response = await settlements.getAllSettlements(beeDebugUrl())

    expect(response.totalReceived).toBeType('bigint')
    expect(response.totalSent).toBeType('bigint')
    expect(Array.isArray(response.settlements)).toBeTruthy()

    if (response.settlements.length > 0) {
      expect(response.settlements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            peer: expect.any(String),
            received: expect.any(BigInt),
            sent: expect.any(BigInt),
          }),
        ]),
      )

      const peerSettlement = response.settlements[0]

      const peerSettlementResponse = await settlements.getSettlements(beeDebugUrl(), peerSettlement.peer)

      expect(peerSettlementResponse.peer).toEqual(peerSettlement.peer)
      expect(peerSettlementResponse.received).toBeType('bigint')
      expect(peerSettlementResponse.sent).toBeType('bigint')
    }
  })
})
