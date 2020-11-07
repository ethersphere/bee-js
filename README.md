# Bee-js

![Node.js tests](https://github.com/ethersphere/bee-js/workflows/Node.js%20tests/badge.svg?branch=master)
[![Dependency Status](https://david-dm.org/ethersphere/bee-js.svg?style=flat-square)](https://david-dm.org/ethersphere/bee-js)
[![](https://img.shields.io/badge/made%20by-Swarm-blue.svg?style=flat-square)](https://swarm.ethereum.org/)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
[![Managed by tAsEgir](https://img.shields.io/badge/%20managed%20by-tasegir-brightgreen?style=flat-square)](https://github.com/auhau/tasegir)
![](https://img.shields.io/badge/npm-%3E%3D6.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/Node.js-%3E%3D10.0.0-orange.svg?style=flat-square)
![](https://img.shields.io/badge/runs%20in-browser%20%7C%20node%20%7C%20webworker%20%7C%20electron-orange)

> Client library for connecting to Bee distributed storage

**Warning: This project is in alpha state. There might (and most probably will) be changes in the future to its API and working. Also, no guarantees can be made about its stability, efficiency, and security at this stage.**

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
> npm install @ethersphere/bee-js
```

### Use in Node.js

```js
var Bee = require("@ethersphere/bee-js");
```

### Use in a browser with browserify, webpack or any other bundler

```js
var Bee = require("@ethersphere/bee-js");
```

### Use in a browser Using a script tag

Loading this module through a script tag will make the `Bee` object available in the global namespace.

```html
<script src="https://unpkg.com/@ethersphere/bee-js/dist/index.min.js"></script>
<!-- OR -->
<script src="https://unpkg.com/@ethersphere/bee-js/dist/index.js"></script>
```

## Usage

```js
import Bee from "@ethersphere/bee-js"; // Connect to a node const

bee = new Bee("http://localhost:8080");

const fileHash = await bee.upload("Bee is awesome!");
const retrievedData = await bee.download(fileHash);

console.log(retrievedData.toString()); // prints 'Bee is awesome!'
```

## Api

[See full API documentation here](./docs/README.md)

## Contribute

There are some ways you can make this module better:

- Consult our [open issues](https://github.com/rsksmart/rif-storage-js/issues) and take on one of them
- Help our tests reach 100% coverage!

### Setup

The project uses `tasegir` to run, build, test and lint. The configuration (`tsconfig.json` & `.eslintrc.js`) is in the tasegir package, you can create symlink to the root directory by running:

```sh
npm run tasegir:link
```

### Test

To run the test, you need to have a Bee cluster running locally. To create a cluster, please consult the readme of [@ethersphere/bee-local](https://github.com/ethersphere/bee-local).

By defaul tests are run against local bee node 0 - `http://bee-0.localhost`. You can change it by setting environment variable `BEE_URL`.

### Generate types

You can generate the types with `NODE_ENV=production npx tasegir compile`.

## License

[BSD-3-Clause](./LICENSE)
