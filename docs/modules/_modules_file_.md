**[@ethersphere/bee-js](../README.md)**

> [Globals](../README.md) / "modules/file"

# Module: "modules/file"

## Index

### Functions

* [download](_modules_file_.md#download)
* [downloadReadable](_modules_file_.md#downloadreadable)
* [upload](_modules_file_.md#upload)

## Functions

### download

▸ **download**(`url`: string, `hash`: string): Promise\<Buffer>

*Defined in [modules/file.ts:51](https://github.com/ethersphere/bee-js/blob/2450765/src/modules/file.ts#L51)*

Download single file as a buffer

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`url` | string | Bee file URL |
`hash` | string | Bee file hash  |

**Returns:** Promise\<Buffer>

___

### downloadReadable

▸ **downloadReadable**(`url`: string, `hash`: string): Promise\<Readable>

*Defined in [modules/file.ts:68](https://github.com/ethersphere/bee-js/blob/2450765/src/modules/file.ts#L68)*

Download single file as a readable stream

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`url` | string | Bee file URL |
`hash` | string | Bee file hash  |

**Returns:** Promise\<Readable>

___

### upload

▸ **upload**(`url`: string, `data`: string \| Buffer \| Readable, `options?`: [OptionsUpload](../interfaces/_types_.optionsupload.md)): Promise\<string>

*Defined in [modules/file.ts:26](https://github.com/ethersphere/bee-js/blob/2450765/src/modules/file.ts#L26)*

Upload single file to a Bee node

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`url` | string | Bee file URL |
`data` | string \| Buffer \| Readable | Data to be uploaded |
`options?` | [OptionsUpload](../interfaces/_types_.optionsupload.md) | Aditional options like tag, encryption, pinning  |

**Returns:** Promise\<string>
