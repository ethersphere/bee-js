# Bee-js

[![Tests](https://github.com/ethersphere/bee-js/actions/workflows/tests.yaml/badge.svg)](https://github.com/ethersphere/bee-js/actions/workflows/tests.yaml)
[![Dependency Status](https://david-dm.org/ethersphere/bee-js.svg?style=flat-square)](https://david-dm.org/ethersphere/bee-js)
[![](https://img.shields.io/badge/made%20by-Swarm-blue.svg?style=flat-square)](https://swarm.ethereum.org/)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
![](https://img.shields.io/badge/npm-%3E%3D6.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D12.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/runs%20in-browser%20%7C%20node%20%7C%20webworker%20%7C%20electron-orange)

> Client library for connecting to Bee decentralised storage

**Warning: This project is in beta state. There might (and most probably will) be changes in the future to its API and working. Also, no guarantees can be made about its stability, efficiency, and security at this stage.**

## Table of Contents

- [Install](#install)
  - [npm](#npm)
  - [Use in Node.js](#use-in-nodejs)
  - [Use in a browser with browserify, webpack or any other bundler](#use-in-a-browser-with-browserify-webpack-or-any-other-bundler)
  - [Use in a browser Using a script tag](#use-in-a-browser-using-a-script-tag)
- [Usage](#usage)
- [API](#api)
- [Contribute](#contribute)
  - [Setup](#setup)
  - [Test](#test)
- [License](#license)

## Install

### npm

```sh
> npm install @ethersphere/bee-js --save
```

### Use in Node.js

**We require Node.js's version of at least 12.x**

```js
var BeeJs = require("@ethersphere/bee-js");
```

### Use in a browser with browserify, webpack or any other bundler

```js
var BeeJs = require("@ethersphere/bee-js");
```

### Use in a browser Using a script tag

Loading this module through a script tag will make the `BeeJs` object available in the global namespace.

```html
<script src="https://unpkg.com/@ethersphere/bee-js/dist/index.browser.min.js"></script>
```

## Usage

```js
import { Bee } from "@ethersphere/bee-js"

bee = new Bee("http://localhost:1633")

const fileHash = await bee.uploadData("Bee is awesome!")
const data = await bee.downloadData(fileHash)

console.log(data.text()) // prints 'Bee is awesome!'
```

## Documentation

You can find the full documentation [here](https://bee-js.ethswarm.org/docs). The API reference documentation can be found [here](https://bee-js.ethswarm.org/docs/api).

You can generate API docs locally with:

```sh
npm run docs
```

The generated docs can be viewed in browser by opening `./docs/index.html`

## Contribute

There are some ways you can make this module better:

- Consult our [open issues](https://github.com/ethersphere/bee-js/issues) and take on one of them
- Help our tests reach 100% coverage!
- Join us in our [Mattermost chat](https://beehive.ethswarm.org/swarm/channels/swarm-javascript) if you have questions or want to give feedback

### Setup

Install project dependencies with

```sh
npm i
```

### Test

The tests run in both context: node and dom with Jest.

To run the integration tests, you need to have a Bee cluster running locally. To create a cluster, please consult the readme of [@ethersphere/bee-local](https://github.com/ethersphere/bee-local).

By default, tests are run against local bee node 0 - `http://bee-0.localhost`. You can change it by setting environment variable `BEE_API_URL`.
In order to run tests which require one more node, you need to define `BEE_PEER_API_URL` as well. Its default value `http://bee-1.localhost`

In Visual Studio environment, the tests have been set up to run against your local bee node on `http://localhost:1633`
To run Jest tests, choose the `vscode-jest-tests` CI job under the Run tab.
You can run your own local Bee client for test purposes with the help of [test/bee.sh](test/bee.sh).
If you pass `--ephemeral` flag, the container automatically will be removed at the end of the run.

There are also browser tests by Puppeteer, which also provide integrity testing.
```sh
npm run test:browser
```
The test HTML file which Puppeteer uses is the [test/testpage/testpage.html](test/testpage/testpage.html).
To open and manually test BeeJS with developer console, it is necessary to build the library first with `npm run compile:browser` (running the browser tests `npm run test:browser` also builds the library).

### Compile code

In order to compile NodeJS code run

`npm run compile:node`

or for Browsers

`npm run compile:browser`

## Maintainers

- [nugaon](https://github.com/nugaon)
- [agazso](https://github.com/agazso)

## License

[BSD-3-Clause](./LICENSE)
