import { Reference } from '../../src'

test('cid manifest', () => {
  const pairs = [
    [
      '44ef8a919a7a2a6fe36712d4512047db406cc7ac5c06da7731e0cb87bab10ff9',
      'bah5acgzaitxyvem2pivg7y3hclkfcich3nagzr5mlqdnu5zr4dfypovrb74q',
    ],
    [
      'a323abacb40c2741ea25dfb2e3a06ae8077fb7f4a79e50b8ec40e2a55d2bbdc1',
      'bah5acgzaumr2xlfubqtud2rf36zohidk5adx7n7uu6pfbohmidrkkxjlxxaq',
    ],
    [
      'fbfd483e80c99973022022af938fe4d96e999b04a19a466374abfa2858647286',
      'bah5acgza7p6uqpuazgmxgaraekxzhd7e3fxjtgyeugnemy3uvp5cqwdeokda',
    ],
    [
      'ac48c36701d3f727faa478407557f9a8453292609c79cfc144ba5becb4bd3c90',
      'bah5acgzavremgzyb2p3sp6vepbahkv7zvbctfetatr447qkexjn6znf5hsia',
    ],
  ]
  for (const [hex, cid] of pairs) {
    const reference = new Reference(cid)
    expect(reference.toHex()).toEqual(hex)
    expect(reference.toCid('manifest')).toEqual(cid)
  }
})

test('cid feed', () => {
  const pairs = [
    [
      '8e7db44c1c8fd418fc6aa2d28849327d1ad712b7c64675d418216792369154bd',
      'bah5qcgzarz63ita4r7kbr7dkuljiqsjspunnoevxyzdhlvayeftzenurks6q',
    ],
    [
      '4480e64b05e83e0363e28e3e6eae8f55bc8a9e61ae11c5eae3521ed0d1cfbf6a',
      'bah5qcgzaisaomsyf5a7agy7cry7g5lupkw6ivhtbvyi4l2xdkipnbuopx5va',
    ],
    [
      '9b78d6efb92af23894a63016281f15c538cfe6bb72b3c3920877e8ced9b06dc2',
      'bah5qcgzatn4nn35zflzdrffggalcqhyvyu4m7zv3okz4heqio7um5wnqnxba',
    ],
    [
      'd698f9212a425ef4993e70ea2e08711f0c5341b7cbb94858e8eb33eea78dbffa',
      'bah5qcgza22mpsijkijppjgj6odvc4cdrd4gfgqnxzo4uqwhi5mz65j4nx75a',
    ],
  ]
  for (const [hex, cid] of pairs) {
    const reference = new Reference(cid)
    expect(reference.toHex()).toEqual(hex)
    expect(reference.toCid('feed')).toEqual(cid)
  }
})
