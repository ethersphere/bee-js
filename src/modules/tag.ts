import { Types } from 'cafe-utility'
import { BeeRequestOptions, Tag } from '../types'
import { http } from '../utils/http'
import { Reference } from '../utils/typed-bytes'

const endpoint = 'tags'

/**
 * Create new tag on the Bee node
 *
 * @param url Bee tag URL
 */
export async function createTag(requestOptions: BeeRequestOptions): Promise<Tag> {
  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: endpoint,
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    address: Types.asEmptiableString(body.address, { name: 'address' }),
    seen: Types.asNumber(body.seen, { name: 'seen' }),
    sent: Types.asNumber(body.sent, { name: 'sent' }),
    split: Types.asNumber(body.split, { name: 'split' }),
    startedAt: Types.asString(body.startedAt, { name: 'startedAt' }),
    stored: Types.asNumber(body.stored, { name: 'stored' }),
    synced: Types.asNumber(body.synced, { name: 'synced' }),
    uid: Types.asNumber(body.uid, { name: 'uid' }),
  }
}

/**
 * Retrieve tag information from Bee node
 *
 * @param url Bee tag URL
 * @param uid UID of tag to be retrieved
 */
export async function retrieveTag(requestOptions: BeeRequestOptions, uid: number): Promise<Tag> {
  const response = await http<unknown>(requestOptions, {
    url: `${endpoint}/${uid}`,
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })

  return {
    address: Types.asEmptiableString(body.address, { name: 'address' }),
    seen: Types.asNumber(body.seen, { name: 'seen' }),
    sent: Types.asNumber(body.sent, { name: 'sent' }),
    split: Types.asNumber(body.split, { name: 'split' }),
    startedAt: Types.asString(body.startedAt, { name: 'startedAt' }),
    stored: Types.asNumber(body.stored, { name: 'stored' }),
    synced: Types.asNumber(body.synced, { name: 'synced' }),
    uid: Types.asNumber(body.uid, { name: 'uid' }),
  }
}

/**
 * Get limited listing of all tags.
 *
 * @param url
 * @param offset
 * @param limit
 */
export async function getAllTags(requestOptions: BeeRequestOptions, offset?: number, limit?: number): Promise<Tag[]> {
  const response = await http<unknown>(requestOptions, {
    url: endpoint,
    params: { offset, limit },
    responseType: 'json',
  })

  const body = Types.asObject(response.data, { name: 'response.data' })
  const tags = Types.asArray(body.tags, { name: 'tags' }).map(x => Types.asObject(x, { name: 'tag' }))

  return tags.map(x => ({
    address: Types.asEmptiableString(x.address, { name: 'address' }),
    seen: Types.asNumber(x.seen, { name: 'seen' }),
    sent: Types.asNumber(x.sent, { name: 'sent' }),
    split: Types.asNumber(x.split, { name: 'split' }),
    startedAt: Types.asString(x.startedAt, { name: 'startedAt' }),
    stored: Types.asNumber(x.stored, { name: 'stored' }),
    synced: Types.asNumber(x.synced, { name: 'synced' }),
    uid: Types.asNumber(x.uid, { name: 'uid' }),
  }))
}

/**
 * Removes tag from the Bee node.
 * @param url
 * @param uid
 */
export async function deleteTag(requestOptions: BeeRequestOptions, uid: number): Promise<void> {
  await http<void>(requestOptions, {
    method: 'delete',
    url: `${endpoint}/${uid}`,
  })
}

/**
 * Updates tag
 * @param url
 * @param uid
 * @param reference
 */
export async function updateTag(requestOptions: BeeRequestOptions, uid: number, reference: Reference): Promise<void> {
  await http<void>(requestOptions, {
    method: 'patch',
    url: `${endpoint}/${uid}`,
    data: {
      reference,
    },
  })
}
