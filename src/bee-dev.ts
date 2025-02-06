import { Types } from 'cafe-utility'
import { Bee, BeeRequestOptions, EthAddress, NodeAddresses, PeerAddress, PublicKey, Topology } from '.'
import { asBin } from './modules/debug/connectivity'
import { http } from './utils/http'
import { assertRequestOptions } from './utils/type'

export class BeeDev extends Bee {
  async getNodeAddresses(options?: BeeRequestOptions): Promise<NodeAddresses> {
    assertRequestOptions(options)

    const requestOptions = super.getRequestOptionsForCall(options)

    const response = await http<unknown>(requestOptions, {
      url: 'addresses',
      responseType: 'json',
    })

    const body = Types.asObject(response.data, { name: 'response.data' })

    return {
      overlay: new PeerAddress(Types.asString(body.overlay, { name: 'overlay' })),
      underlay: [],
      ethereum: new EthAddress(Types.asString(body.ethereum, { name: 'ethereum' })),
      publicKey: new PublicKey(Types.asString(body.publicKey, { name: 'publicKey' })),
      pssPublicKey: new PublicKey(Types.asString(body.pssPublicKey, { name: 'pssPublicKey' })),
    }
  }

  async getTopology(options?: BeeRequestOptions): Promise<Topology> {
    assertRequestOptions(options)

    const requestOptions = super.getRequestOptionsForCall(options)

    const response = await http<unknown>(requestOptions, {
      url: `topology`,
      responseType: 'json',
    })

    const body = Types.asObject(response.data, { name: 'response.data' })
    const bins = Types.asObject(body.bins, { name: 'bins' })

    return {
      baseAddr: '0bab5ca208a980950604f900f2791613fc980676c2dee7dd92a4fdda5a54bf26',
      population: Types.asNumber(body.population, { name: 'population' }),
      connected: Types.asNumber(body.connected, { name: 'connected' }),
      timestamp: Types.asString(body.timestamp, { name: 'timestamp' }),
      nnLowWatermark: Types.asNumber(body.nnLowWatermark, { name: 'nnLowWatermark' }),
      depth: Types.asNumber(body.depth, { name: 'depth' }),
      reachability: 'Public',
      networkAvailability: 'Available',
      bins: {
        bin_0: asBin(bins.bin_0, 'bin_0'),
        bin_1: asBin(bins.bin_1, 'bin_1'),
        bin_2: asBin(bins.bin_2, 'bin_2'),
        bin_3: asBin(bins.bin_3, 'bin_3'),
        bin_4: asBin(bins.bin_4, 'bin_4'),
        bin_5: asBin(bins.bin_5, 'bin_5'),
        bin_6: asBin(bins.bin_6, 'bin_6'),
        bin_7: asBin(bins.bin_7, 'bin_7'),
        bin_8: asBin(bins.bin_8, 'bin_8'),
        bin_9: asBin(bins.bin_9, 'bin_9'),
        bin_10: asBin(bins.bin_10, 'bin_10'),
        bin_11: asBin(bins.bin_11, 'bin_11'),
        bin_12: asBin(bins.bin_12, 'bin_12'),
        bin_13: asBin(bins.bin_13, 'bin_13'),
        bin_14: asBin(bins.bin_14, 'bin_14'),
        bin_15: asBin(bins.bin_15, 'bin_15'),
        bin_16: asBin(bins.bin_16, 'bin_16'),
        bin_17: asBin(bins.bin_17, 'bin_17'),
        bin_18: asBin(bins.bin_18, 'bin_18'),
        bin_19: asBin(bins.bin_19, 'bin_19'),
        bin_20: asBin(bins.bin_20, 'bin_20'),
        bin_21: asBin(bins.bin_21, 'bin_21'),
        bin_22: asBin(bins.bin_22, 'bin_22'),
        bin_23: asBin(bins.bin_23, 'bin_23'),
        bin_24: asBin(bins.bin_24, 'bin_24'),
        bin_25: asBin(bins.bin_25, 'bin_25'),
        bin_26: asBin(bins.bin_26, 'bin_26'),
        bin_27: asBin(bins.bin_27, 'bin_27'),
        bin_28: asBin(bins.bin_28, 'bin_28'),
        bin_29: asBin(bins.bin_29, 'bin_29'),
        bin_30: asBin(bins.bin_30, 'bin_30'),
        bin_31: asBin(bins.bin_31, 'bin_31'),
      },
    }
  }
}
