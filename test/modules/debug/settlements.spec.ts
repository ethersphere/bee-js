import * as settlements from '../../../src/modules/debug/settlements'
import { beeDebugUrl } from '../../utils'

describe('settlements', () => {
  test('all settlements', async () => {
    const response = await settlements.getAllSettlements(beeDebugUrl())

    expect(typeof response.totalreceived).toBe('number')
    expect(typeof response.totalsent).toBe('number')
    expect(Array.isArray(response.settlements)).toBeTruthy()

    if (response.settlements.length > 0) {
      expect(response.settlements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            peer: expect.any(String),
            received: expect.any(Number),
            sent: expect.any(Number),
          }),
        ]),
      )

      const peerSettlement = response.settlements[0]

      const peerSettlementResponse = await settlements.getSettlements(beeDebugUrl(), peerSettlement.peer)

      expect(peerSettlementResponse.peer).toEqual(peerSettlement.peer)
      expect(typeof peerSettlementResponse.received).toBe('number')
      expect(typeof peerSettlementResponse.sent).toBe('number')
    }
  })
})
