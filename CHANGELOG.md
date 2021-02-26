# Changelog

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
