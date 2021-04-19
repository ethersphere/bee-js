# Changelog
## [0.8.0](https://www.github.com/ethersphere/bee-js/compare/v0.7.1...v0.8.0) (2021-04-19)

### ☁️ High-level feed's API

We understand that the current Feed's API is rather a low level and to use it for simple tasks might be overwhelming. We designed high-level API, that works for JSON data (arrays, objects, etc.) in a very convenient way. See the example bellow:

```js
await bee.setJsonFeed(
  'some cool arbitraty topic',
  { some: ['cool', { json: 'compatible' }, 'object']},
  { signer: '0x634fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd' }
)
const data = await bee.getJsonFeed(
  'some cool arbitraty topic',
  { signer: '0x634fb5a872396d9693e5c9f9d7233cfa93f395c093371017ff44aa9ae6564cdd' }
)
console.log(data)
// Prints: { some: ['cool', { json: 'compatible' }, 'object']}
```

### ⚠️ `BigInt` breaking change

JavaScript has limitations on how big numbers it can safely represent before floating errors come into the picture. Since the BZZ token has 16 decimal places we are able to safely represent only `0.9` BZZ which is not much. Because of this, we had to switch from using `number` to [`bigint`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) type on money-related APIs that concerns balances, chequebook, and settlements.

### ⚙️ Internal refactors

As part of our internal code improvements, we have renamed all `verify*` functions into `assert*`. This mainly impacts `BeeJS.Utils.Bytes` namespace where for example `verifyBytes` was renamed to `assertBytes`. As part of this change also the order of parameters was changed and some return types as well. If you use TypeScript the changes should be caught by our typings, if you are using JavaScript please verify you are not using these functions or refactor your code appropriately.

---

### ⚠ BREAKING CHANGES

* verify to assert ([#255](https://www.github.com/ethersphere/bee-js/issues/255)) ([725292b](https://www.github.com/ethersphere/bee-js/commit/725292b97afb07354346400f915f9f678e8f3306))
* use bigint for bzz amounts ([#259](https://www.github.com/ethersphere/bee-js/issues/259)) ([9da31c2](https://www.github.com/ethersphere/bee-js/commit/9da31c2051df42f48cedd5ae00821f42aeb8fec5))

### Features

* enable setting default headers ([#271](https://www.github.com/ethersphere/bee-js/issues/271)) ([21d63e3](https://www.github.com/ethersphere/bee-js/commit/21d63e3efebd86d018434d5af085753bd1455b4a))
* expose pinning functions ([#262](https://www.github.com/ethersphere/bee-js/issues/262)) ([8a4274e](https://www.github.com/ethersphere/bee-js/commit/8a4274ef141ffd021c5956e106978662cbaa91df))
* high-level json feed api ([#246](https://www.github.com/ethersphere/bee-js/issues/246)) ([4b22563](https://www.github.com/ethersphere/bee-js/commit/4b22563d7c499b036bb5535d49417aed21ed7504))


### Bug Fixes

* check typings for test folder ([#264](https://www.github.com/ethersphere/bee-js/issues/264)) ([b924e89](https://www.github.com/ethersphere/bee-js/commit/b924e890c6cfc506e114894838634bae5d904083))
* use bigint for bzz amounts ([#259](https://www.github.com/ethersphere/bee-js/issues/259)) ([9da31c2](https://www.github.com/ethersphere/bee-js/commit/9da31c2051df42f48cedd5ae00821f42aeb8fec5))

### Code Refactoring

* verify to assert ([#255](https://www.github.com/ethersphere/bee-js/issues/255)) ([725292b](https://www.github.com/ethersphere/bee-js/commit/725292b97afb07354346400f915f9f678e8f3306))
### [0.7.1](https://www.github.com/ethersphere/bee-js/compare/v0.7.0...v0.7.1) (2021-03-31)


### Bug Fixes

* point to correct typings path ([#241](https://www.github.com/ethersphere/bee-js/issues/241)) ([e214417](https://www.github.com/ethersphere/bee-js/commit/e21441744dc6fea6025d0417121143817dd740df))

## [0.7.0](https://www.github.com/ethersphere/bee-js/compare/v0.6.0...v0.7.0) (2021-03-30)


### ⚠ BREAKING CHANGES

* replaced `getPssPublicKey` with `getNodeAddresses` (#228)
* isEthAddress to isHexEthAddress (#234)
* hex string length support (#213)

### Features

* add supported bee version to package.json ([#240](https://www.github.com/ethersphere/bee-js/issues/240)) ([7bc26e5](https://www.github.com/ethersphere/bee-js/commit/7bc26e51ecdf79f52afeb1d424bb26567bd1c9c3))
* data helpers for downloaded bytes ([#219](https://www.github.com/ethersphere/bee-js/issues/219)) ([3af3826](https://www.github.com/ethersphere/bee-js/commit/3af3826a4f2343e0cd7ae37094c286dc261a6e4b))
* default signer on bee instance ([#224](https://www.github.com/ethersphere/bee-js/issues/224)) ([de46e8f](https://www.github.com/ethersphere/bee-js/commit/de46e8f0f6ffab2a1e096390bb656aa8e0e86bbd))
* ethereum wallet signer utility ([#230](https://www.github.com/ethersphere/bee-js/issues/230)) ([94bc9f4](https://www.github.com/ethersphere/bee-js/commit/94bc9f44b3be68529c32741a37403d9e83efd425))
* expose external types ([#235](https://www.github.com/ethersphere/bee-js/issues/235)) ([5c1ddac](https://www.github.com/ethersphere/bee-js/commit/5c1ddac74064109d9eeb2459a049ad4d7100aaba))
* hex string length support ([#213](https://www.github.com/ethersphere/bee-js/issues/213)) ([53a2c25](https://www.github.com/ethersphere/bee-js/commit/53a2c255620a029d18228708b5967337a025bd11))
* improved signer interface and validation ([#223](https://www.github.com/ethersphere/bee-js/issues/223)) ([769476d](https://www.github.com/ethersphere/bee-js/commit/769476d3a43e7f1e001a34396d90ad76e95e7c45))
* missing endpoints on Bee and BeeDebug class ([#207](https://www.github.com/ethersphere/bee-js/issues/207)) ([bad1cae](https://www.github.com/ethersphere/bee-js/commit/bad1cae41973ce213b1ed8203a5b34a6c742a8ea))
* replaced `getPssPublicKey` with `getNodeAddresses` ([#228](https://www.github.com/ethersphere/bee-js/issues/228)) ([2932725](https://www.github.com/ethersphere/bee-js/commit/29327252624c9ec58082dba4729663079a3608ae))


### Bug Fixes

* adding string type and assertions to Reference on API ([#232](https://www.github.com/ethersphere/bee-js/issues/232)) ([3467e7d](https://www.github.com/ethersphere/bee-js/commit/3467e7d441a86966638ea2220ff7b6c54e66dcf8))


### Code Refactoring

* isEthAddress to isHexEthAddress ([#234](https://www.github.com/ethersphere/bee-js/issues/234)) ([cfe49e6](https://www.github.com/ethersphere/bee-js/commit/cfe49e60d129f99d76d8c1c0d9d648b9aec18957))

## [0.6.0](https://www.github.com/ethersphere/bee-js/compare/v0.5.1...v0.6.0) (2021-03-15)


### ⚠ BREAKING CHANGES

* correct getChequebookBalance spelling (remove extra u) (#189)

### Bug Fixes

* no ethereum prefix for custom signers ([#194](https://www.github.com/ethersphere/bee-js/issues/194)) ([2ee1eca](https://www.github.com/ethersphere/bee-js/commit/2ee1eca179b724a70e9d7caea6dcd677e910e3d5))
* **pss:** subscribe in browsers, removed readable in browsers ([#180](https://www.github.com/ethersphere/bee-js/issues/180)) ([a88277d](https://www.github.com/ethersphere/bee-js/commit/a88277db374b3bafe273614954d43afad72018e8))
* strip trailining slash in node url ([#203](https://www.github.com/ethersphere/bee-js/issues/203)) ([8e81024](https://www.github.com/ethersphere/bee-js/commit/8e81024ff25fb1f3e0e6332c4ea6bdc605c50b31))


### Code Refactoring

* correct getChequebookBalance spelling (remove extra u) ([#189](https://www.github.com/ethersphere/bee-js/issues/189)) ([20efd70](https://www.github.com/ethersphere/bee-js/commit/20efd708b8cf7ddd215cc5ed972cd4fefc6917e1))

### [0.5.1](https://www.github.com/ethersphere/bee-js/compare/v0.5.0...v0.5.1) (2021-02-26)


### Features

* axios options ([#134](https://www.github.com/ethersphere/bee-js/issues/134)) ([6e5fb05](https://www.github.com/ethersphere/bee-js/commit/6e5fb05a8a20d65c5c63fd4a6d3ad91b96fc2ab8))
* eth utils for PSS ([#149](https://www.github.com/ethersphere/bee-js/issues/149)) ([7cbe2ee](https://www.github.com/ethersphere/bee-js/commit/7cbe2ee489e2feb469482d0e00674f675e557172))
* expose the getPeers function on `BeeDebug` ([#155](https://www.github.com/ethersphere/bee-js/issues/155)) ([fcfa547](https://www.github.com/ethersphere/bee-js/commit/fcfa5471b283b2c91db37ede5a98ec53c828faf8))
* expose types for BeeDebug ([#158](https://www.github.com/ethersphere/bee-js/issues/158)) ([1f3051e](https://www.github.com/ethersphere/bee-js/commit/1f3051edf92ed1970d27c5d347de7219a9863e3b))
* exposing soc interface ([#147](https://www.github.com/ethersphere/bee-js/issues/147)) ([7897163](https://www.github.com/ethersphere/bee-js/commit/78971637c9e9286a232456dfd953e69f32132e2d))
* feed interface ([#136](https://www.github.com/ethersphere/bee-js/issues/136)) ([021af95](https://www.github.com/ethersphere/bee-js/commit/021af9570c30b1c6283da71946bd23f45f4f09cf))
* feeds endpoint ([#125](https://www.github.com/ethersphere/bee-js/issues/125)) ([6b0a59b](https://www.github.com/ethersphere/bee-js/commit/6b0a59b380d66827cf404de32bf7c6c8529c491f))


### Bug Fixes

* bee.sh ([#131](https://www.github.com/ethersphere/bee-js/issues/131)) ([113b66c](https://www.github.com/ethersphere/bee-js/commit/113b66c248724de9482375d763c0ae3446257b2b))
* bump elliptic version to 6.5.4 ([#142](https://www.github.com/ethersphere/bee-js/issues/142)) ([d6ac8b0](https://www.github.com/ethersphere/bee-js/commit/d6ac8b0b52093289725f8e199bbd45fc457b38a9))
* release 0.5.1 ([#145](https://www.github.com/ethersphere/bee-js/issues/145)) ([b0a2168](https://www.github.com/ethersphere/bee-js/commit/b0a2168bac9769aa4c52964a3fdc923453c5e5f8))
* remove automatic content-type header on file upload ([#139](https://www.github.com/ethersphere/bee-js/issues/139)) ([393d068](https://www.github.com/ethersphere/bee-js/commit/393d0681134616799b894bdd6d0a25ec061e3db9)), closes [#138](https://www.github.com/ethersphere/bee-js/issues/138)

## [0.5.0](https://www.github.com/ethersphere/bee-js/compare/v0.4.2...v0.5.0) (2021-02-09)


### ⚠ BREAKING CHANGES

* breaking api changes (#105)

### Features

* balance, chequebook and settlements endpoint on BeeDebug ([#101](https://www.github.com/ethersphere/bee-js/issues/101)) ([7a77050](https://www.github.com/ethersphere/bee-js/commit/7a7705081d625f98a9b8e5822434e6be540c9454))
* balances and consumed endpoint ([#96](https://www.github.com/ethersphere/bee-js/issues/96)) ([162e9b3](https://www.github.com/ethersphere/bee-js/commit/162e9b3c9ab5324331a6abb87ac6b3ee716dc57c))
* chequebook api ([#97](https://www.github.com/ethersphere/bee-js/issues/97)) ([f7b77f4](https://www.github.com/ethersphere/bee-js/commit/f7b77f4c3cfeb25b29f09716ebbb4cd4abb96b03))
* export utils and types ([#123](https://www.github.com/ethersphere/bee-js/issues/123)) ([fb1ed72](https://www.github.com/ethersphere/bee-js/commit/fb1ed722678995666cece7cddd46e948b02598af))
* settlements endpoints ([#98](https://www.github.com/ethersphere/bee-js/issues/98)) ([892ce1b](https://www.github.com/ethersphere/bee-js/commit/892ce1b9d2815902294db4372329e83ee5fcd37d))
* uploadFile support for File type ([#93](https://www.github.com/ethersphere/bee-js/issues/93)) ([02202e9](https://www.github.com/ethersphere/bee-js/commit/02202e906950b4e67255a47f6fdd79abddfeba5c))


### Bug Fixes

* missing content-disposition causes failure ([#116](https://www.github.com/ethersphere/bee-js/issues/116)) ([2c85db0](https://www.github.com/ethersphere/bee-js/commit/2c85db052181cf331c9cc76e0efa089112155af5))
* typescript configuration ([#120](https://www.github.com/ethersphere/bee-js/issues/120)) ([e665107](https://www.github.com/ethersphere/bee-js/commit/e6651076e47a33d2d5b5c2aba786a20ae80e91b2))


### Code Refactoring

* breaking api changes ([#105](https://www.github.com/ethersphere/bee-js/issues/105)) ([5eb1d15](https://www.github.com/ethersphere/bee-js/commit/5eb1d1587598f81cb4b86714cbc0196f0430dbb7))

### 0.4.2 (2021-02-01)


### Features

* Bee class functionality with error handling ([#15](https://www.github.com/ethersphere/bee-js/issues/15)) ([038f013](https://www.github.com/ethersphere/bee-js/commit/038f013f44e31cb024e7503db19e8c7c116debc5))
* bmt hasher ([#65](https://www.github.com/ethersphere/bee-js/issues/65)) ([5cac9b2](https://www.github.com/ethersphere/bee-js/commit/5cac9b2b573a2dfbaf7705e889dfada1520787a2))
* bytes module ([#50](https://www.github.com/ethersphere/bee-js/issues/50)) ([9ec08bd](https://www.github.com/ethersphere/bee-js/commit/9ec08bd4b5c5fa1df424f43c3d1f4d640d98b7fd))
* chunk API module ([#60](https://www.github.com/ethersphere/bee-js/issues/60)) ([110b092](https://www.github.com/ethersphere/bee-js/commit/110b092b88b25cb6c2b69a2713ce95da54012eb0))
* module collection ([#28](https://www.github.com/ethersphere/bee-js/issues/28)) ([e4ed0bd](https://www.github.com/ethersphere/bee-js/commit/e4ed0bd265521c1c11eb55be039219a01edf2112))
* pinning for files and collections ([#45](https://www.github.com/ethersphere/bee-js/issues/45)) ([c6fcc21](https://www.github.com/ethersphere/bee-js/commit/c6fcc21389414a2d420525bef3b5eda8f829cd3b))
* pss send and subscribe ([#49](https://www.github.com/ethersphere/bee-js/issues/49)) ([c0b2ac1](https://www.github.com/ethersphere/bee-js/commit/c0b2ac1dc89475755d967e374135af755c0686ef))
* repo setup, adds tag and file api wrapper ([#1](https://www.github.com/ethersphere/bee-js/issues/1)) ([d1d1484](https://www.github.com/ethersphere/bee-js/commit/d1d148431143059bb55c579ffceb6dcee836c5e2))
* single owner chunks ([#69](https://www.github.com/ethersphere/bee-js/issues/69)) ([e152206](https://www.github.com/ethersphere/bee-js/commit/e15220660e35f77197919018612b2bc556d9c413))
* tar upload in the browser ([#35](https://www.github.com/ethersphere/bee-js/issues/35)) ([4787428](https://www.github.com/ethersphere/bee-js/commit/4787428e2867d6b931e3dd4afcbdff019e75434b))


### Bug Fixes

* big file upload ([#77](https://www.github.com/ethersphere/bee-js/issues/77)) ([a51e4a6](https://www.github.com/ethersphere/bee-js/commit/a51e4a6471f2c0503e71c7f9322021495b838565)), closes [#75](https://www.github.com/ethersphere/bee-js/issues/75)
* collection upload with relative path ([#73](https://www.github.com/ethersphere/bee-js/issues/73)) ([b8f5c90](https://www.github.com/ethersphere/bee-js/commit/b8f5c906b8845d90ee4ba7ea02e0dfd3ae55d02f))
* raise payment tolerance on tests ([#64](https://www.github.com/ethersphere/bee-js/issues/64)) ([4c3043b](https://www.github.com/ethersphere/bee-js/commit/4c3043be4034611c1b69d75f781a88366697c6b4))
* remove postinstall ([#74](https://www.github.com/ethersphere/bee-js/issues/74)) ([992a2de](https://www.github.com/ethersphere/bee-js/commit/992a2deb31e54e95ab1f5751164a47b8906880f5))
* remove utf8-encoder package dependency ([#82](https://www.github.com/ethersphere/bee-js/issues/82)) ([e5b9e12](https://www.github.com/ethersphere/bee-js/commit/e5b9e129c6a39cdfb714982e33e9e3761ed57b91))
* replace Buffer with Uint8Array so it's not used in browser ([#84](https://www.github.com/ethersphere/bee-js/issues/84)) ([a59bcda](https://www.github.com/ethersphere/bee-js/commit/a59bcda8ac3334a0b24ceea5c37b1df6a6b80439))
* upload collection with unicode filenames ([#79](https://www.github.com/ethersphere/bee-js/issues/79)) ([c893e58](https://www.github.com/ethersphere/bee-js/commit/c893e582bad30ff742c5f3884af41a02d2817f36))
* websocket data buffer array typing ([#89](https://www.github.com/ethersphere/bee-js/issues/89)) ([251a650](https://www.github.com/ethersphere/bee-js/commit/251a65028ae12cc538965855a79663c402988348))
