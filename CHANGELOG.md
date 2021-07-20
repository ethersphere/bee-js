# Changelog
## [1.1.0](https://www.github.com/ethersphere/bee-js/compare/v1.0.0...v1.1.0) (2021-07-20)


### Features

* hooks system ([#367](https://www.github.com/ethersphere/bee-js/issues/367)) ([97441b3](https://www.github.com/ethersphere/bee-js/commit/97441b3137ff1e10ff43f7ccb8ae45b547175907))
* new tags endpoints ([#365](https://www.github.com/ethersphere/bee-js/issues/365)) ([90dc15e](https://www.github.com/ethersphere/bee-js/commit/90dc15e0b0232de3d08127e16da2b5a499d5abbb))

## [1.0.0](https://www.github.com/ethersphere/bee-js/compare/v0.12.0...v1.0.0) (2021-06-22)

This release bumps the supported Bee version to 1.0.0, which marks the mainnet launch of the project.

### Miscellaneous Chores

* release 1.0.0 ([#356](https://www.github.com/ethersphere/bee-js/issues/356)) ([f409915](https://www.github.com/ethersphere/bee-js/commit/f40991585074a7cf07e7f13fdd3aef6577b59677))

## [0.12.0](https://www.github.com/ethersphere/bee-js/compare/v0.11.0...v0.12.0) (2021-06-17)

This is a compatibility release for the Bee 1.0.0-rc2. It also handles extended postage stamp information.

### ⚠ BREAKING CHANGES

* use string instead of bigint (#345)

### Features

* add folder and collection size check utility functions ([#349](https://www.github.com/ethersphere/bee-js/issues/349)) ([f289c81](https://www.github.com/ethersphere/bee-js/commit/f289c81ecb77c8754589d67c1b9ca03d379dc23a))
* extend PostageBatch type and creation with new properties ([#350](https://www.github.com/ethersphere/bee-js/issues/350)) ([7695e27](https://www.github.com/ethersphere/bee-js/commit/7695e27bcac758c153609ba973830c0472e1e5c6))


### Bug Fixes

* add missing stream package with webpack ([#351](https://www.github.com/ethersphere/bee-js/issues/351)) ([a083a1b](https://www.github.com/ethersphere/bee-js/commit/a083a1b5bb98277db3ef15a80aa8044718fb00f5)), closes [#348](https://www.github.com/ethersphere/bee-js/issues/348)


### Code Refactoring

* use string instead of bigint ([#345](https://www.github.com/ethersphere/bee-js/issues/345)) ([358ca42](https://www.github.com/ethersphere/bee-js/commit/358ca4231595b9883aed0d8eade39da509cbb118))

## [0.11.0](https://www.github.com/ethersphere/bee-js/compare/v0.10.0...v0.11.0) (2021-06-09)

This release mainly brings internal improvements as we have attacked head-on our backlog with outstanding issues. But several changes introduce breaking changes so be aware and continue reading on!

### 🔎 Input validation

We implemented thorough input validation to catch problems even before sending requests to Bee and give better errors on what is wrong.

### ⚠ BREAKING CHANGES

- Methods `Bee.pin()`, `Bee.unpin()`, `Bee.pssSend()` now return `Promise<void>` (#342)
- Methods `Bee.setJsonFeed()`, `SocWriter.upload()`, `FeedWriter.upload()` now return directly the reference hash (string) instead of it being wrapped in object (#341)
- The new input validation might require more thorough types specification

### Features

* input validation ([#343](https://www.github.com/ethersphere/bee-js/issues/343)) ([1a33932](https://www.github.com/ethersphere/bee-js/commit/1a33932233f255d7d89d8b6336ab1191f9946484))


### Reverts

* empty test data ([#339](https://www.github.com/ethersphere/bee-js/issues/339)) ([ffecd9f](https://www.github.com/ethersphere/bee-js/commit/ffecd9fbc1e2a2e8a1e9b757af6a0346b826951f))


### Code Refactoring

* no generic BeeResponse returned from Bee class ([#342](https://www.github.com/ethersphere/bee-js/issues/342)) ([d2a65ee](https://www.github.com/ethersphere/bee-js/commit/d2a65ee31b42eed70685a62085164c39caf092c0))
* no single-property object returned ([#341](https://www.github.com/ethersphere/bee-js/issues/341)) ([572253c](https://www.github.com/ethersphere/bee-js/commit/572253c173b4acc8c2e515677f66a68c8e5076b0))

---

## [0.10.0](https://www.github.com/ethersphere/bee-js/compare/v0.9.0...v0.10.0) (2021-06-01)

We would like to introduce you to a new release that brings access to other new features of `0.6.0` Bee release and several other improvements. This version is compatible with `0.6.2` version of Bee.

### ⁉️ Improved error reporting

Until now most returned Errors contained very limited information on what actually went wrong as most of the problems originated directly from the Bee node. We improved our internal handling of these errors and now if Bee returns the reason for the error we pass it along with our thrown errors.

### ⛓ New endpoints

We have included support for the new Bee Debug's endpoints that exposes chain state with `BeeDebug.getChainState()` (`/chainstate`) and reserve state `BeeDebug.getReserveState()` (`/reservestate`).

### ♻️ Reupload support

Now you can re-upload content that you have locally pinned in your node to the network with `Bee.reuploadPinnedData()`. If the data is not pinned, then an error is thrown.

### ⛽️ Gas prices and limits for transactions

Now you can specify a gas price for methods that create transactions:
-  `BeeDebug.cashoutLastCheque()`
-  `BeeDebug.depositTokens()`
-  `BeeDebug.withdrawTokens()`

---

### ⚠ BREAKING CHANGES

* `Promise` returning methods from now on never throw errors, but return rejected promise instead (#326)
* `BeeDebug.cashoutLastCheque()` now directly returns the transaction hash as string and not object (#325)
* `BeeDebug.depositTokens()` now directly returns the transaction hash as string and not object (#336)
* `BeeDebug.withdrawTokens()` now directly returns the transaction hash as string and not object (#336)

### Features

* chain and reserve state endpoints ([#324](https://www.github.com/ethersphere/bee-js/issues/324)) ([0ec57e9](https://www.github.com/ethersphere/bee-js/commit/0ec57e986109aee3faff5061821d3f0e04bf8bae))
* pass error message from bee to thrown error ([#314](https://www.github.com/ethersphere/bee-js/issues/314)) ([59b5834](https://www.github.com/ethersphere/bee-js/commit/59b5834c2b97c5e23ac8b1c5c13d29b3ca60399a))
* expose stamps depth limits ([#334](https://www.github.com/ethersphere/bee-js/issues/334)) ([0bb4dcf](https://www.github.com/ethersphere/bee-js/commit/0bb4dcf24cd2de66bf682094765340ef80cfc6eb))
* reupload ([#323](https://www.github.com/ethersphere/bee-js/issues/323)) ([3a256f8](https://www.github.com/ethersphere/bee-js/commit/3a256f8d26114ad18d3c361a23cc05f6bf7a27fa))
* support gas price and limit for cashout ([#325](https://www.github.com/ethersphere/bee-js/issues/325)) ([61195c7](https://www.github.com/ethersphere/bee-js/commit/61195c780f934b3e4cf778ef8fa47391956459a5))


### Bug Fixes

* correctly return reject promise for promise returning fnc ([#326](https://www.github.com/ethersphere/bee-js/issues/326)) ([d76ef2d](https://www.github.com/ethersphere/bee-js/commit/d76ef2dd216de9d02349e1ae818c592e1c1678a6))

---

## [0.9.0](https://www.github.com/ethersphere/bee-js/compare/v0.8.1...v0.9.0) (2021-05-20)

We would like to introduce you to this big release with many changes that follow the [Bee's 0.6.0 release](https://github.com/ethersphere/bee/releases/tag/v0.6.0) and is fully compatible with it. This release contains new features and breaking changes that depend on the new Bee version, so if you have not already read the [Bee's release notes](https://github.com/ethersphere/bee/releases/tag/v0.6.0) do so for a better understanding of changes!

### 💮 Postage Stamp support

One of the most significant changes in Bee is the support of Postage Stamps (read about them [here](https://docs.ethswarm.org/access-the-swarm/keep-your-data-alive)). They are now **required** for all "write" operations like uploading files, writing to manifests, or sending PSS messages. You can now create a new postage batch with `bee.createPostageBatch()` method, but be aware this spends the Bee node's Ethereum and BZZ to create the batch with the on-chain transaction! Use with caution.

```javascript=
const bee = new Bee(...)

const batchId = await bee.createPostageBatch(10, 17) // example values
const reference = await bee.uploadData(batchId, 'Hello world')
```

### 📍 Pinning methods simplification

The new pinning API now doesn't distinguish between the underlying data structure, so you simply pin any type of content with one method `bee.pin(reference)` and unpin with `bee.unpin(reference)`.

### ↺ Renaming and refactoring

Some endpoints were removed, and some properties renamed. We also used this opportunity to streamline our API. Please check breaking changes!

---

### ⚠️ BREAKING CHANGES

- Removing `bee.download*FromCollection` method ([#280](https://github.com/ethersphere/bee-js/pull/280))
- Removed `recursive` flag from `uploadFilesFromDirectory` ([#280](https://github.com/ethersphere/bee-js/pull/280))
- Following methods are removed `bee.pinFile()`, `bee.unpinFile()`, `bee.pinCollection()` `bee.unpinCollection()`, `bee.pinData()`, `bee.unpinData()`, `bee.pinChunk()`, `bee.unpinChunk()`, `bee. getChunkPinningStatus()` ([#293](https://github.com/ethersphere/bee-js/pull/293))
- Following properties were converted from snake_case to camelCase ([#301](https://github.com/ethersphere/bee-js/pull/301)):
  - `BeeDebug.getNodeAddresses()`: `public_key`, `pss_public_key`
  - `BeeDebug.getChequebookAddress()`: `chequebookaddress`
  - `BeeDebug.getAllSettlements()`: `total_received`, `total_sent`

### Features

* gas price for postage batch creation ([#312](https://www.github.com/ethersphere/bee-js/issues/312)) ([7e47e09](https://www.github.com/ethersphere/bee-js/commit/7e47e09b087b967fc2b57c50b82c630ba20df345))
* limit postage depth ([#318](https://www.github.com/ethersphere/bee-js/issues/318)) ([e9a4758](https://www.github.com/ethersphere/bee-js/commit/e9a4758017c3d0fc6c554a16cd6d725819f8882d))
* postage stamp support ([#290](https://www.github.com/ethersphere/bee-js/issues/290)) ([da50ad6](https://www.github.com/ethersphere/bee-js/commit/da50ad6714e1ef885c03f45510c5ac19e3b769b4))


### Bug Fixes

* if there are no postage stamps the getAllPostageBatch should return [] ([#319](https://www.github.com/ethersphere/bee-js/issues/319)) ([82985d3](https://www.github.com/ethersphere/bee-js/commit/82985d3761c3d7bc51d205f20f3a0636eb76f250))
* last cheque peer response property case ([#320](https://www.github.com/ethersphere/bee-js/issues/320)) ([c8f0cea](https://www.github.com/ethersphere/bee-js/commit/c8f0cea09fe996398a02138e9df0702da49d3879))
* shape of `LastCashoutActionResponse` for Bee 0.6.0 ([#306](https://www.github.com/ethersphere/bee-js/issues/306)) ([d637379](https://www.github.com/ethersphere/bee-js/commit/d637379b52bc6ce229c02d18bfba87e4194b3107))
* use bigint primitive ([#287](https://www.github.com/ethersphere/bee-js/issues/287)) ([6e104dc](https://www.github.com/ethersphere/bee-js/commit/6e104dca1f1da4fb9713789854bc1b4ea31cefef))


### Code Refactoring

* camelCasing of some properties ([#301](https://www.github.com/ethersphere/bee-js/issues/301)) ([13cd882](https://www.github.com/ethersphere/bee-js/commit/13cd882e10094e90ae0e9f132bda7c4aec4c6f30))
* new pinning api ([#293](https://www.github.com/ethersphere/bee-js/issues/293)) ([bc90e7b](https://www.github.com/ethersphere/bee-js/commit/bc90e7ba0e9dfd4f3bb92192a9348bce75ce1491))
* use bzz endpoint for file and dirs ([#280](https://www.github.com/ethersphere/bee-js/issues/280)) ([6cd8f28](https://www.github.com/ethersphere/bee-js/commit/6cd8f28470f0358782f7a44c649aac29ccbc9c82))

### [0.8.1](https://www.github.com/ethersphere/bee-js/compare/v0.8.0...v0.8.1) (2021-04-21)


### Bug Fixes

* expose hashing function ([#277](https://www.github.com/ethersphere/bee-js/issues/277)) ([d6c0b22](https://www.github.com/ethersphere/bee-js/commit/d6c0b22e0c083513cfdae369e90b14637083eece))
* support address option for getJsonFeed ([#276](https://www.github.com/ethersphere/bee-js/issues/276)) ([85a7574](https://www.github.com/ethersphere/bee-js/commit/85a7574fbd2372542360fdd047a42e139cb733f5))

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

JavaScript has limitations on how it can safely represent big numbers before floating errors come into the picture. Since the BZZ token has 16 decimal places we are able to safely represent only `0.9` BZZ which is not much. Because of this, we had to switch from using `number` to [`bigint`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) type on money-related APIs that concerns balances, chequebook, and settlements.

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
