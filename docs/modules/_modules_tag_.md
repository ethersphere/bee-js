**[@ethersphere/bee-js](../README.md)**

> [Globals](../README.md) / "modules/tag"

# Module: "modules/tag"

## Index

### Functions

* [createTag](_modules_tag_.md#createtag)
* [retrieveTag](_modules_tag_.md#retrievetag)

## Functions

### createTag

▸ **createTag**(`url`: string): Promise\<[Tag](../interfaces/_types_.tag.md)>

*Defined in [modules/tag.ts:9](https://github.com/ethersphere/bee-js/blob/2450765/src/modules/tag.ts#L9)*

Create new tag on the Bee node

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`url` | string | Bee tag URL  |

**Returns:** Promise\<[Tag](../interfaces/_types_.tag.md)>

___

### retrieveTag

▸ **retrieveTag**(`url`: string, `tag`: [Tag](../interfaces/_types_.tag.md) \| number): Promise\<[Tag](../interfaces/_types_.tag.md)>

*Defined in [modules/tag.ts:24](https://github.com/ethersphere/bee-js/blob/2450765/src/modules/tag.ts#L24)*

Retrieve tag information from Bee node

#### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`url` | string | Bee tag URL |
`tag` | [Tag](../interfaces/_types_.tag.md) \| number | UID or tag object to be retrieved  |

**Returns:** Promise\<[Tag](../interfaces/_types_.tag.md)>
