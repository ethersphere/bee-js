import { Utils } from '../../../src'

describe('cid', () => {
  it('should convert cid', () => {
    expect(
      Utils.convertReferenceToCid('ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338', 'manifest'),
    ).toBe('bah5acgzazjrvpieogf6rl3cwb7xtjzgel6hrt4a4g4vkody5u4v7u7y2im4a')

    expect(
      Utils.convertReferenceToCid('ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338', 'feed'),
    ).toBe('bah5qcgzazjrvpieogf6rl3cwb7xtjzgel6hrt4a4g4vkody5u4v7u7y2im4a')

    expect(Utils.convertCidToReference('bah5acgzazjrvpieogf6rl3cwb7xtjzgel6hrt4a4g4vkody5u4v7u7y2im4a')).toStrictEqual({
      type: 'manifest',
      reference: 'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338',
    })

    expect(Utils.convertCidToReference('bah5qcgzazjrvpieogf6rl3cwb7xtjzgel6hrt4a4g4vkody5u4v7u7y2im4a')).toStrictEqual({
      type: 'feed',
      reference: 'ca6357a08e317d15ec560fef34e4c45f8f19f01c372aa70f1da72bfa7f1a4338',
    })
  })
})
