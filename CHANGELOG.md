# Changelog


## [5.0.0](https://github.com/ethersphere/bee-js/compare/v4.1.1...v5.0.0) (2022-07-28)


### ⚠ BREAKING CHANGES

* enable waiting for postage batch to be usable by default (#746)
* adds support for Feed Manifest CID (#745)
* drop node 12 support (#741)
* drop DebugPostageBatch in favor of PostageBatch inteface (#743)
* drop NodesInfo in favor of NodeInfo inteface (#742)
* convert cid getter to function (#740)

### Features

* adds support for Feed Manifest CID ([#745](https://github.com/ethersphere/bee-js/issues/745)) ([37c5b55](https://github.com/ethersphere/bee-js/commit/37c5b552544a7d239de934b064726c2861de83ff))
* enable waiting for postage batch to be usable by default ([#746](https://github.com/ethersphere/bee-js/issues/746)) ([cb05d22](https://github.com/ethersphere/bee-js/commit/cb05d220998f39e214684cf9e24d0005c4adc96d))


### Bug Fixes

* convert cid getter to function ([#740](https://github.com/ethersphere/bee-js/issues/740)) ([0b46862](https://github.com/ethersphere/bee-js/commit/0b4686299b2de320220c5beafb2e4c13c64bad80))


### Code Refactoring

* drop DebugPostageBatch in favor of PostageBatch inteface ([#743](https://github.com/ethersphere/bee-js/issues/743)) ([3f66764](https://github.com/ethersphere/bee-js/commit/3f66764dcabd724c6a29612bcb7f9e0f5122d77f))
* drop NodesInfo in favor of NodeInfo inteface ([#742](https://github.com/ethersphere/bee-js/issues/742)) ([acddb14](https://github.com/ethersphere/bee-js/commit/acddb14d85698a7dc26ea2ed183a13732b8c8d95))


### Miscellaneous Chores

* drop node 12 support ([#741](https://github.com/ethersphere/bee-js/issues/741)) ([f79eb3f](https://github.com/ethersphere/bee-js/commit/f79eb3fcc9d51fcc6cb57f89cb30b1377b07c5d4))

### [4.1.1](https://github.com/ethersphere/bee-js/compare/v4.1.0...v4.1.1) (2022-05-26)

This is a hotfix release to our build setup that published bee-js with a broken package structure.

### Bug Fixes

* move sleep to have all code in src ([#696](https://github.com/ethersphere/bee-js/issues/696)) ([19171cc](https://github.com/ethersphere/bee-js/commit/19171cc3ccd3c3cce35abd1b2dfb6874e4fcb30d))

## [4.1.0](https://github.com/ethersphere/bee-js/compare/v4.0.0...v4.1.0) (2022-05-24)

Shortly after the last release, we bring you another release that brings some nice improvements and new features together with some fixes.

### ✅  Node 18

We have verified the support for Node 18. It introduces a native implementation of [`fetch` API](https://nodejs.org/api/globals.html#fetch) that we use as HTTP client. This implementation wraps the errors that it throws into a nested Error object, so we unwrap these errors for better error handling.

### ⏳  Waiting for postage stamps to be usable

When a postage stamp is created the (`BeeDebug.createPostageStamp()` method is called), Bee creates an on-chain transaction that creates this transaction in the smart contract, but the stamp is not immediately "usable" as Bee waits for several blockchain blocks in order to be sure that the postage stamp won't disappear from the blockchain. During this period Bee won't accept this stamp and will return the error `stamp is not usable`. After this period Bee pronounces it as usable and the users can upload content using it.

In most use cases, when you create the postage stamp you want to actually wait until the stamp is usable and only then return it to the user. For that, you had to implement your own waiting logic, **but no more!**

The `BeeDebug.createPostageStamp()` method has a new option `waitForUsable` which if specified, then the Promise this method returns is resolved only after the Bee confirms the postage stamp to be usable. **Be aware that if used, then the call time of this method raises dramatically!**

**In the next breaking release this option will be turned on, by default!**

### 🔐  Wallet endpoint support

The [Bee 1.6.0 release](https://github.com/ethersphere/bee/releases/tag/v1.6.0) introduced `/wallet` endpoint that exposes the balance of the node's wallet and some other related metrics. In this release we add support for this endpoint.

### Features

* cids support ([#681](https://github.com/ethersphere/bee-js/issues/681)) ([02d8f9c](https://github.com/ethersphere/bee-js/commit/02d8f9cf7476fe565dc0c6d7dd00865a10f263fd))
* expose underlying undici error messages ([#694](https://github.com/ethersphere/bee-js/issues/694)) ([b164b70](https://github.com/ethersphere/bee-js/commit/b164b702dc4d1f6264428259f7b29c22250d3331))
* support for waiting on stamp to be usable ([#678](https://github.com/ethersphere/bee-js/issues/678)) ([f675dc3](https://github.com/ethersphere/bee-js/commit/f675dc35dea60745983319751c6eaa1948adea99))
* wallet endpoint support ([#683](https://github.com/ethersphere/bee-js/issues/683)) ([2af84c0](https://github.com/ethersphere/bee-js/commit/2af84c009bcdec32abea65d227ad4cf059a308fc))


### Bug Fixes

* modify the ENS validation to work in safari or older browsers ([#687](https://github.com/ethersphere/bee-js/issues/687)) ([2e172fb](https://github.com/ethersphere/bee-js/commit/2e172fb2e0e4cfba821f6a523ae4feb3dc785f5b))
* no invalid amount for stamps ([#682](https://github.com/ethersphere/bee-js/issues/682)) ([b2697d5](https://github.com/ethersphere/bee-js/commit/b2697d5f299f47141caf5e5935bf6fa41fb2e5e4))

## [4.0.0](https://github.com/ethersphere/bee-js/compare/v3.3.4...v4.0.0) (2022-05-18)

This release brings several new features and one ad-hoc breaking fix that is passed on from the new [Bee version 1.6.0](https://github.com/ethersphere/bee/releases/tag/v1.6.0), but affects only the `BeeDebug.getReserveState()` method.

### 💮  ENS support

Bee supports ENS for resolution of ENS domains into Swarm references. `bee-js` was until now refusing ENS domains with the input validation. Now we are bringing support for all the `download*` methods and a few other ones as well.

### 🗂. Get Feed's specific update

The `FeedReader.download()` function now accepts an option `index` where you can specify which of the feed's updates you want to download.

### ❓ Is Feed Retrievable?

There is a new method `Bee.isFeedRetrievable()` that helps you to check whether a given feed is available.

It operates in two modes. If you know the last index of the feed update then you can use it as an optional parameter and then be sure that this update is present in the network. If you won't specify the `index` parameter, then it will check for the "latest" update by traversing all the known updates from the start. This does not guarantee though that the found "latest" update is indeed the latest one though and hence provides a weaker guarantee.

### ⚠ BREAKING CHANGES

* reserve state update response interface (#675)

### Features

* ens support for download methods ([#659](https://github.com/ethersphere/bee-js/issues/659)) ([e72c4b4](https://github.com/ethersphere/bee-js/commit/e72c4b4cd2dc593a3bae4d4ba9418800f9ccc195))
* fetch specific feed index update ([#629](https://github.com/ethersphere/bee-js/issues/629)) ([a4672dc](https://github.com/ethersphere/bee-js/commit/a4672dc427206097fd3837b2b97c528a44f19418))
* is feed retrievable support ([#641](https://github.com/ethersphere/bee-js/issues/641)) ([e1071b0](https://github.com/ethersphere/bee-js/commit/e1071b0549a6d40418572312f0a648d6923c5428))

### Bug Fixes

* reserve state update response interface ([#675](https://github.com/ethersphere/bee-js/issues/675)) ([f8564e3](https://github.com/ethersphere/bee-js/commit/f8564e36371f75903d62562f7d800ba5645d6985))

### [3.3.4](https://www.github.com/ethersphere/bee-js/compare/v3.3.3...v3.3.4) (2022-04-12)

This is a small patch release that brings mainly support for the new Bee 1.5.1 and two small bug fixes.

### Bug Fixes

* nodeinfo interface ([#622](https://www.github.com/ethersphere/bee-js/issues/622)) ([6a70cad](https://www.github.com/ethersphere/bee-js/commit/6a70cade07007a20fe442ef62306f1a2b3a84733))
* remove browser blob polyfill for service workers support ([#614](https://www.github.com/ethersphere/bee-js/issues/614)) ([7c5c78d](https://www.github.com/ethersphere/bee-js/commit/7c5c78ddb1598e43c39441b1f9108bd00e12dd3c))

### [3.3.3](https://www.github.com/ethersphere/bee-js/compare/v3.3.2...v3.3.3) (2022-03-25)

### 🧱 EcmaScript Modules

The bee-js v3.3.0 introduced support for ES Modules. In v3.3.3 we increase the compatibility with older versions of various build systems.

### Bug Fixes

* relax es version requirements ([#601](https://www.github.com/ethersphere/bee-js/issues/601)) ([af10012](https://www.github.com/ethersphere/bee-js/commit/af10012ed2dc0a1fca25f667ba53aae789b852f1))

### [3.3.2](https://www.github.com/ethersphere/bee-js/compare/v3.3.1...v3.3.2) (2022-03-21)


This is another small release that brings support for [Bee 1.5.0](https://github.com/ethersphere/bee/releases/tag/v1.5.0) and a few small improvements.

### 🔌 Node endpoint

The Bee 1.5.0 introduced new mode called ultra-light mode. This mode has been added to the existing `BeeModes`.

### 🧱 EcmaScript Modules

The bee-js v3.3.0 introduced support for ES Modules. In 3.3.2 we include several fixes to resolve some of the reported issues and broken builds.

### Bug Fixes

* add cross-env to devDeps ([c559535](https://www.github.com/ethersphere/bee-js/commit/c5595356d6aabe45307afc284dfc4439ca11ad00))
* add ultra light bee mode ([#597](https://www.github.com/ethersphere/bee-js/issues/597)) ([4ac6bd8](https://www.github.com/ethersphere/bee-js/commit/4ac6bd8679657becbd7dd2305e1ba14ce784b98d))
* replace deprecated type DebugPostageBatch with PostageBatch ([#594](https://www.github.com/ethersphere/bee-js/issues/594)) ([265557d](https://www.github.com/ethersphere/bee-js/commit/265557d9912e92133c847c90b8fbc065cbfa6405))
* web-stream-polyfill typings ([#585](https://www.github.com/ethersphere/bee-js/issues/585)) ([3b18848](https://www.github.com/ethersphere/bee-js/commit/3b18848d07f8eb67b6f190fed09e12617105a933))

### [3.3.1](https://www.github.com/ethersphere/bee-js/compare/v3.3.0...v3.3.1) (2022-02-16)

This is a patching release that targets especially issues discovered thanks to the introduction of the ESM hybrid build. The main change is that if you want to use the function [`Utils.readableWebToNode()`](https://bee-js.ethswarm.org/docs/api/functions/Utils.readableWebToNode/) in **browser** then you have to polyfill `stream` package with your bundler.

### Bug Fixes

* add js suffix in imports for esm support with babel ([#562](https://www.github.com/ethersphere/bee-js/issues/562)) ([62489aa](https://www.github.com/ethersphere/bee-js/commit/62489aa2259a60c2e46caecbf56d98bbc12f93ed))
* create minified browser bundle for release ([#549](https://www.github.com/ethersphere/bee-js/issues/549)) ([b92fdb0](https://www.github.com/ethersphere/bee-js/commit/b92fdb010f831faa50c1575829b42cdbf0730600))
* drop readable stream ([#565](https://www.github.com/ethersphere/bee-js/issues/565)) ([3e36ccc](https://www.github.com/ethersphere/bee-js/commit/3e36cccdf18cf3dd9d87e317c644a3dd67e347db))
* exposing ky options ([#553](https://www.github.com/ethersphere/bee-js/issues/553)) ([085c565](https://www.github.com/ethersphere/bee-js/commit/085c565775c1abfa36b160fd539f4b80a05299e5))
* making readable-stream optional ([#556](https://www.github.com/ethersphere/bee-js/issues/556)) ([4983fdc](https://www.github.com/ethersphere/bee-js/commit/4983fdc1f92fc35129bf01b4a606c23f9ebffde3))
* rename the browser bundle in order not to break unpkg.com ([#552](https://www.github.com/ethersphere/bee-js/issues/552)) ([7076d94](https://www.github.com/ethersphere/bee-js/commit/7076d9413382e1e4f0f7aec8563ec84729cf4524))
* use default import styles for esm compatibility ([#550](https://www.github.com/ethersphere/bee-js/issues/550)) ([90aaf7b](https://www.github.com/ethersphere/bee-js/commit/90aaf7b0e800db3d94bb205bcd64bf1b3e17d939))

## [3.3.0](https://www.github.com/ethersphere/bee-js/compare/v3.2.0...v3.3.0) (2022-02-09)

This is a smaller update with two main changes.

### 🧱 EcmaScript Modules support

We plan to migrate our bee-js package to ES Modules (see the [issue](https://github.com/ethersphere/bee-js/issues/394) for more info)  when Node v12 will reach its end-of-life (on 30th of April). With this release, we are starting a transition period by supporting both ES Modules and CommonJS builds. Please start migrating your applications to the ESM stack otherwise, you won't be able to upgrade bee-js after we drop support for CommonJS.

### ❓ Is supported version?

Since we are in a fast-paced environment where Bee's versions can be incompatible with each other, it is important that in your application you check whether the Bee that you connect to has the correct version that you expect and support (through `bee-js`).

Untill now we had the [`isSupportedVersion()`](https://bee-js.ethswarm.org/docs/api/classes/BeeDebug/#issupportedversion) function that indicated if the Bee node version is not matching the one that `bee-js` was tested and built against. This implementation has its downside because it is very strict and if for example there is a small Bee's release that patches only something internal and does not touch the API, which means that the `bee-js` should be compatible, you will still get a `false` with this check.

Except for Bee's version itself, there are two other versions that version the Bee endpoint's API and the Bee Debug endpoint's API. We have decided to implement methods that do compatibility checks using these versions and hence should be more relaxed towards Bee's small patches but might pose some risk if some change will be unnoticed and API versions not bumped accordingly.

These methods are:
- `BeeDebug.isSupportedExactVersion()` - renamed `isSupportedVersion` which is now deprecated
- `BeeDebug.isSupportedMainApiVersion()` which checks compatibility only for the main Bee endpoint
- `BeeDebug.isSupportedDebugApiVersion()` which checks compatibility only for the Bee Debug endpoint
- `BeeDebug.isSupportedApiVersion()` which checks compatibility for both endpoints

The compatibility is checked using the major versions of the API. If you would like to make your own assertions you can get all the versions (both from Bee itself and the one that bee-js should support) using the method `BeeDebug.getVersions()`

### Features

* add owner property to SOCReader interface ([#534](https://www.github.com/ethersphere/bee-js/issues/534)) ([15581ce](https://www.github.com/ethersphere/bee-js/commit/15581ce9af2e90dbb86aeb95d6f3b6c3edd374ee))
* api versions support ([#543](https://www.github.com/ethersphere/bee-js/issues/543)) ([d9e5973](https://www.github.com/ethersphere/bee-js/commit/d9e597356f04790f621641c1824162883b34db37))
* hybrid esm build ([#533](https://www.github.com/ethersphere/bee-js/issues/533)) ([2305fc6](https://www.github.com/ethersphere/bee-js/commit/2305fc6ebc5a4ba06b677e9c6cf00814ce3a6304))

## [3.2.0](https://www.github.com/ethersphere/bee-js/compare/v3.1.0...v3.2.0) (2022-01-25)

This is after some time a bigger update that brings some new goodies from [Bee 1.4.1 version](https://github.com/ethersphere/bee/releases/tag/v1.4.1) and improved error handling and support.

### ↔️ Direct upload support

Bee introduced direct upload mode, where Bee directly pushes the data to the network instead of the intermediate step of locally saving the data and then syncing it with the network. You can enable this behavior by passing `deferred = false` into `UploadOptions` interface. When you enable this mode the `Promise` returned by the upload methods will resolve only once the data is uploaded and synchronized with the network so if you use timeouts you should adjust those base on the size of data you upload.

**Currently, the direct upload mode is by default turned off, but it is a plan in the future to enable this behavior by default!**

### ⁉️ Error handling

Now `BeeResponseError` and `BeeRequestError` instances contain information about the request (and if applicable also response) that triggered the Error. Also, it has improved for non-JSON responses that were causing unclear errors.

### ⚠️ Deprecations

In this release, there are two changes in Interface's names that are non-breaking as there are backward compatible aliases, but these aliases will be removed with the next breaking change.

- Interface `DebugPostageBatch` was renamed to `PostageBatch`
- Interface `NodesInfo` was renamed to `NodeInfo`

### Features

* direct upload support ([#504](https://www.github.com/ethersphere/bee-js/issues/504)) ([e05fae7](https://www.github.com/ethersphere/bee-js/commit/e05fae76056339a7fdaa21a9382a23d69ed465b2))
* exposing request and response configuration on BeeResponseError ([#517](https://www.github.com/ethersphere/bee-js/issues/517)) ([7448958](https://www.github.com/ethersphere/bee-js/commit/7448958e00ed3e26704bfb7833460c4a5221506c))
* node 17 support ([#507](https://www.github.com/ethersphere/bee-js/issues/507)) ([c9e727a](https://www.github.com/ethersphere/bee-js/commit/c9e727a4b6b584044c371cf9f77d29676ebd5067))

### Bug Fixes

* handling of non-json responses when json is expected ([#508](https://www.github.com/ethersphere/bee-js/issues/508)) ([8e0962c](https://www.github.com/ethersphere/bee-js/commit/8e0962c992f04ed4212928556efb90937e30d6f2))
* rename DebugPostageBatch into PostageBatch ([#495](https://www.github.com/ethersphere/bee-js/issues/495)) ([38f2758](https://www.github.com/ethersphere/bee-js/commit/38f27587a8291745cfa3821608931f71b256444a))
* rename NodesInfo into NodeInfo ([#493](https://www.github.com/ethersphere/bee-js/issues/493)) ([9d1ec0a](https://www.github.com/ethersphere/bee-js/commit/9d1ec0a44691f5ffdb12e77402e0e112f0162398))

## [3.1.0](https://www.github.com/ethersphere/bee-js/compare/v3.0.0...v3.1.0) (2021-12-09)

This is another small release that brings support for [Bee 1.4.1](https://github.com/ethersphere/bee/releases/tag/v1.4.1) and a few small improvements

### 🔌 Node endpoint support

The Bee 1.4.1 release brought a new endpoint on Debug API called `/node` which provides information about in what mode the Bee node runs (such as dev mode, light mode, or full mode or information about gateway mode).

### 🔗 Chunk endpoint supports

We used chunk endpoints internally in bee-js but now we have decided to expose them for your usage as well.

### ∵ Stamp usage utility functions

In order to calculate the usage of a postage stamp (eq. percentage in form of a number between 0 and 1) we have added a small utility function that calculates it called `getStampUsage()`.

### Features

* exposing chunk functionality ([#472](https://www.github.com/ethersphere/bee-js/issues/472)) ([b121dcb](https://www.github.com/ethersphere/bee-js/commit/b121dcb037ed77f20d7543e7b74a85f2dd97ae41))
* node endpoint support ([#479](https://www.github.com/ethersphere/bee-js/issues/479)) ([11731d3](https://www.github.com/ethersphere/bee-js/commit/11731d32c8e83bbc0bd4e16367c86f27f8fd79cb))
* stamp usage utility function ([#470](https://www.github.com/ethersphere/bee-js/issues/470)) ([b53edd1](https://www.github.com/ethersphere/bee-js/commit/b53edd12193ea60a9372ffaa7ae79001b7decfc5))


### Bug Fixes

* convert buffer to uint8array for readablestream ([#473](https://www.github.com/ethersphere/bee-js/issues/473)) ([7f34ea6](https://www.github.com/ethersphere/bee-js/commit/7f34ea6b8c62c75b8a0ab7b66983121388a5b34f))

---

## [3.0.0](https://www.github.com/ethersphere/bee-js/compare/v2.1.1...v3.0.0) (2021-11-25)

This is a small release in size, but big on impact. It is a breaking release thanks to breaking changes introduced in [Bee 1.4](https://github.com/ethersphere/bee/releases/tag/v1.4.0).

### ⚠ BREAKING CHANGES

* dropping postage stamps methods from `Bee` class (#458)

### Features

* dropping bee class postage stamps methods ([#458](https://www.github.com/ethersphere/bee-js/issues/458)) ([98afdcd](https://www.github.com/ethersphere/bee-js/commit/98afdcd3e4e930f5ea29b46f050c2b5966c850fe))
* openapi versions in `/health` endpoint and methods ([#459](https://www.github.com/ethersphere/bee-js/issues/459)) ([98afdcd](https://www.github.com/ethersphere/bee-js/commit/98afdcd3e4e930f5ea29b46f050c2b5966c850fe))

---

### [2.1.1](https://www.github.com/ethersphere/bee-js/compare/v2.1.0...v2.1.1) (2021-11-08)

This is small release that fixes few small issues and mainly brings compatibility with the Bee 1.3.

### Bug Fixes

* **build:** sourcemap ([#440](https://www.github.com/ethersphere/bee-js/issues/440)) ([2bfb7c8](https://www.github.com/ethersphere/bee-js/commit/2bfb7c8cc2db00bc361cf14fcc766ac395dfce09))
* readable-stream should be dependency ([#444](https://www.github.com/ethersphere/bee-js/issues/444)) ([fd39c46](https://www.github.com/ethersphere/bee-js/commit/fd39c460027a6578e8fc2cd8c27507e129f581bf))
* **build:** limit the scope of files that are published to npm

---

## [2.1.0](https://www.github.com/ethersphere/bee-js/compare/v2.0.0...v2.1.0) (2021-10-13)

This release is a compatibility release with [Bee 1.2.0](https://github.com/ethersphere/bee/releases/tag/v1.2.0) release, which brings few new features.

### Is retrievable? support

The new method `bee.isReferenceRetrievable()` allows you to check whether the data represented by a reference is present in the network. This is part of the Stewardship endpoint, which also allows you to reupload the data that you have locally available (pinned).

### 🏷 New Postage Batch methods

There is a new method `beeDebug.topUpBatch()`, that allows you to top-up the amount of existing batch, effectively prolonging its lifetime.

Moreover, there is also a new method `beeDebug.diluteBatch()` that increases the depth of a batch, effectively extending the number of chunks that the batch can stamp and lowering the lifetime of a batch.

### 📨 PSS Target limit increase

⚠️ **If you use the utility function `makeMaxTarget`, then the time of sending a PSS message will increase! Consider using your own criteria based on your use-case.**

### Features

* increased max pss target limit ([#430](https://www.github.com/ethersphere/bee-js/issues/430)) ([3134c50](https://www.github.com/ethersphere/bee-js/commit/3134c50074e9694ff916fb356e1d36c8ab23b2d6))
* is reference retrievable support ([#425](https://www.github.com/ethersphere/bee-js/issues/425)) ([76601f8](https://www.github.com/ethersphere/bee-js/commit/76601f82cbc6ccee72e92f488907933c98071410))
* topup and dilute batch methods ([#424](https://www.github.com/ethersphere/bee-js/issues/424)) ([7bf2135](https://www.github.com/ethersphere/bee-js/commit/7bf213582bcb5a96a000790498d57d8ee2d19c92))


### Bug Fixes

* `uploadResult.tagUid` always present ([#429](https://www.github.com/ethersphere/bee-js/issues/429)) ([bc76e79](https://www.github.com/ethersphere/bee-js/commit/bc76e7986706cac76d258de098d3f0712f23f38d))


### Reverts

* bee 1.1.0 version check workaround ([#428](https://www.github.com/ethersphere/bee-js/issues/428)) ([7d42eb7](https://www.github.com/ethersphere/bee-js/commit/7d42eb7d4eaca00cbae6aaf8ac740f311f8bcab5))

---

## [2.0.0](https://www.github.com/ethersphere/bee-js/compare/v1.2.1...v2.0.0) (2021-09-20)

This is our first major version bump as we did a big revamp of `bee-js` internals and fixed a few things and shortcomings that required breaking changes.

### 🤖 HTTP client swap (timeout and retries support)

In the JS browser ecosystem, there are two main HTTP clients: old XMLHttpRequest (XHR) API and new modern `fetch` API.

We originally used `axios` library that employs the XHR client, but XHR is old and will not get any new features as it is superseded with `fetch` API that is actively developed by the WHATWG group, and hence it has its limitations. Many limitations can be overcome using polyfills etc. but a hard stop is networking that only browsers decide what to allow (usually based on the specification). In the case of XHR the limitation is streaming support.

We have therefore decided to use `fetch` based library `ky` that supports streaming downloads and hopefully in close future will support also streaming uploads (see [whatwg/fetch#966](https://github.com/whatwg/fetch/issues/966), there is also already functional experiment that [enables this in Chrome](https://www.chromestatus.com/feature/5274139738767360)). `fetch` is also more future-proof.

This change, unfortunately, does not come without a cost and that is support for tracking upload progress, that `fetch` still does not have (if interested please comment on the relevant [whatwg/fetch#607](https://github.com/whatwg/fetch/issues/607) issue to raise importance).
If this feature is crucial for you, we have devised a workaround thanks to @mattiaz9, which is demonstrated in our [example `upload-progress`](https://github.com/ethersphere/examples-js/tree/master/upload-progress).

This change unfortunately is breaking as we originally exposed `AxiosOptions` on our API. We have refactored this into more generic HTTP options that should be more future-proof. Thanks to `ky` we also now have support for retries of failed requests (only for non-`POST` requests, defaults are seen [here](https://github.com/sindresorhus/ky#retry)) and timeouts. Both are possible to set generally for the `Bee` instance and/or override it for each method call.

### 🎏 Streaming revamp

As part of the HTTP client revamp, we had a deeper look at how we handle streams. In the JS land, there are two main types of streams the NodeJS [`Readable`](https://nodejs.org/api/stream.html#stream_class_stream_readable) and the browser WHATWG [`ReadableStream`](http://developer.mozilla.org/en-US/docs/Web/API/ReadableStream). As our design mindset is browser-first and polyfill the rest in NodeJs, we have unified all returned streams into the WHATWG `ReadableStream` no matter what platform you are on. Most probably you will want to use NodeJs `Readable` on NodeJs platform, so we have included utility function [`readableWebToNode`](https://bee-js.ethswarm.org/docs/api/functions/utils.readableWebToNode/) that converts WHATWG stream into NodeJs. There are also more stream-related utility functions that you can check out.

For stream inputs, we accept both types of streams and convert them internally.

### ⏎ Upload results refactor

One of our short-coming was dropping the returned object from upload methods in favor of the simple string `Reference`. Later on, we discovered that there is actually a need to return more information from upload operations because [Bee automatically creates a Tag for each upload](https://docs.ethswarm.org/docs/access-the-swarm/syncing#generate-the-tag-automatically) that we could return. Hence we have introduced back [`UploadResult`](https://bee-js.ethswarm.org/docs/api/interfaces/uploadresult/) interface that all the upload methods will now return.

### 🫓 Utility namespace flatting and filtering

We have merged all the `Utils.*` namespaces directly into `Utils` and we have filtered out the functions only to those that make sense to expose in order to minimize the public API and possible future breaking changes.

### 🗾 `uploadCollection()` method

We have introduced new `uploadCollection` method that is more flexible in uploading collection if you do not want to use our convenience methods like `uploadFilesFromDirectory()` or `uploadFiles`. This new method accepts the [`Collection<Uint8Array | Readable>`](https://bee-js.ethswarm.org/docs/api/interfaces/collection/) interface.

### ⚠ BREAKING CHANGES

- Requests made by `bee-js` are now reported with `User-Agent: bee-js/<<bee-js's version>>` (#390)
- `Utils.setDefaultHeaders()` was removed in favor of `Bee`/`BeeDebug` instance's option `defaultHeaders` (#390)
- Hooks (#390)
  - `Utils.hooks.*` was removed in favor of `Bee`/`BeeDebug` instance's options `onRequest` and `onResponse`
  - Hooks now pass only metadata of the requests and not the payload
- All returned streams are now of [`WHATWG ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream). If you need NodeJS's Readable you can use `Utils.readableWebToNode()` utility function. (#390)
- All `axiosOptions` were removed from those methods that supported it (for example `bee.downloadReadableData()`, `bee.reuploadPinnedData()`, `UploadOptions` does not have `axiosOptions` property anymore) (#390)
- Unfortunately `fetch` does not support tracking of upload progress (like XHR/axios supported with the `onUploadProgress`). Please see our [example `upload-progress`](https://github.com/ethersphere/examples-js/tree/master/upload-progress) for work-around. (#390)
- All upload methods now returns `UploadResult` interface (#408)
- `bee.pssSend()` now throws error if the specified target exceeds maximal value. Use `Utils.makeMaxTarget()` that will give you the max target that Bee accepts. (#384)
- `Utils` namespace is flattened and limited on the functions (#395)

### Other changes:

- All upload methods that used to accept NodeJS's Readable now accept both NodeJS and WHATWG Readable(Stream).
- Usage of ReadableStreams in a browser is now possible. Be aware that real support for streaming browsers has only for download, but not upload. When Readable is passed to upload methods it is first fully buffered before making the request.

### Features

* HTTP request options is possible to override per method call ([#411](https://www.github.com/ethersphere/bee-js/issues/411)) ([9eac5cd](https://www.github.com/ethersphere/bee-js/commit/9eac5cd1a75277566b7d48255467afcd0d478f23))
* return `UploadResult` for upload methods ([#408](https://www.github.com/ethersphere/bee-js/issues/408)) ([e58b8e8](https://www.github.com/ethersphere/bee-js/commit/e58b8e8629159cdcea23b9b3327813b459f2bf76))

### Bug Fixes

* pss target length verification ([#384](https://www.github.com/ethersphere/bee-js/issues/384)) ([fd032a8](https://www.github.com/ethersphere/bee-js/commit/fd032a826a39cd48d5c2030baabc58970cd4af91))
* remove check for pinned content in reupload ([#412](https://www.github.com/ethersphere/bee-js/issues/412)) ([6032a22](https://www.github.com/ethersphere/bee-js/commit/6032a220a8a572421cac0200197843470ab50858))

### Code Refactoring

* ky replaces axios ([#390](https://www.github.com/ethersphere/bee-js/issues/390)) ([5f08d1e](https://www.github.com/ethersphere/bee-js/commit/5f08d1e799d5338ed9ac935805e7d9a1f7939fa6))
* utility module flatting and limiting ([#395](https://www.github.com/ethersphere/bee-js/issues/395)) ([ee68ed2](https://www.github.com/ethersphere/bee-js/commit/ee68ed2a10892d53826535d85dcf5d0b734f45fb))

## [1.2.1](https://www.github.com/ethersphere/bee-js/compare/v1.2.0...v1.2.1) (2021-08-27)


### Bug Fixes

* bee 1.1.0 version reporting workaround ([#401](https://www.github.com/ethersphere/bee-js/issues/401)) ([687e431](https://www.github.com/ethersphere/bee-js/commit/687e4318b0ae6ed62dc23d6d1ce1abad3938e20b))

## [1.2.0](https://www.github.com/ethersphere/bee-js/compare/v1.1.1...v1.2.0) (2021-08-24)

This is mainly a compatibility release with [Bee 1.1.0](https://github.com/ethersphere/bee/releases/tag/v1.1.0) release.

### 🏷 Stamps API move and deprecation

The Stamps API was moved to Debug API and on normal API it is now deprecated. Moreover, Bee provides more information on Debug API with for example `batchTtl` that gives an estimation for how long the batch will be valid.

### ⛓ Pending transaction management supports

New Debug API was added that allows you to manage pending transactions and do things like:

- list pending transactions
- rebroadcast already created (pending) transaction
- cancel a pending transaction

### Features

* new debug postage api ([#381](https://www.github.com/ethersphere/bee-js/issues/381)) ([dcd6dd3](https://www.github.com/ethersphere/bee-js/commit/dcd6dd34893e961fd5716683c113927bb21b588f))
* pending transactions management ([#399](https://www.github.com/ethersphere/bee-js/issues/399)) ([144440b](https://www.github.com/ethersphere/bee-js/commit/144440b4b3c5d5d8b52638b2e502b307089baec3))

## [1.1.1](https://www.github.com/ethersphere/bee-js/compare/v1.1.0...v1.1.1) (2021-07-21)

This is a small patch release that fixes missing headers in requests/responses returned using the hooks system.

### Bug Fixes

* provide all request headers ([#370](https://www.github.com/ethersphere/bee-js/issues/370)) ([5b4c94b](https://www.github.com/ethersphere/bee-js/commit/5b4c94bfd43904623bd2c0a4427f74784f34a3e8))

## [1.1.0](https://www.github.com/ethersphere/bee-js/compare/v1.0.0...v1.1.0) (2021-07-16)

This is a small incremental release that brings two new features.

### 🪝 Hooks system

If you need to know what exact HTTP requests `bee-js` sends to Bee you can now register hooks for outgoing requests and incoming responses using [`Utils.Hooks` interface](https://bee-js.ethswarm.org/docs/api/modules/utils.hooks).

**Be aware! These listeners listen to all outgoing `bee-js`'s requests/responses, so if you have multiple `Bee`/`BeeDebug` instances for different Bee nodes, than all requests will be forwarded to your callbacks!**

### 🏷 New Tag endpoints

With the `1.0` Bee release few new endpoints related to [Tags](https://docs.ethswarm.org/docs/access-the-swarm/syncing) were introduced that allows you to list, update and delete tags.


### Features

* hooks system ([#367](https://www.github.com/ethersphere/bee-js/issues/367)) ([97441b3](https://www.github.com/ethersphere/bee-js/commit/97441b3137ff1e10ff43f7ccb8ae45b547175907))
* new tags endpoints ([#365](https://www.github.com/ethersphere/bee-js/issues/365)) ([90dc15e](https://www.github.com/ethersphere/bee-js/commit/90dc15e0b0232de3d08127e16da2b5a499d5abbb))

---

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
