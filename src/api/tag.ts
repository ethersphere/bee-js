import type { AllTagsOptions, BeeRequestOptions, Tag as TagData } from '../types'
import { GetAllTagsResponse, TagSchema } from '../types/schema/tag'
import { http } from '../utils/http'
import { Reference } from '../utils/typed-bytes'

const endpoint = 'tags'

/** Creates a new tag. */
export async function createTag(requestOptions: BeeRequestOptions): Promise<TagData> {
  const response = await http<unknown>(requestOptions, {
    method: 'post',
    url: endpoint,
    responseType: 'json',
  })

  return TagSchema.parse(response.data)
}

/** Fetches all tags in a paginated manner. */
export async function getAllTags(requestOptions: BeeRequestOptions, options?: AllTagsOptions): Promise<TagData[]> {
  const response = await http<unknown>(requestOptions, {
    url: endpoint,
    params: { offset: options?.offset, limit: options?.limit },
    responseType: 'json',
  })

  return GetAllTagsResponse.parse(response.data).tags
}

/** Retrieves tag information from the Bee node. */
export async function getTag(requestOptions: BeeRequestOptions, uid: number): Promise<TagData> {
  const response = await http<unknown>(requestOptions, {
    url: `${endpoint}/${uid}`,
    responseType: 'json',
  })

  return TagSchema.parse(response.data)
}

/** Deletes a tag. */
export async function deleteTag(requestOptions: BeeRequestOptions, uid: number): Promise<void> {
  await http<void>(requestOptions, {
    method: 'delete',
    url: `${endpoint}/${uid}`,
  })
}

/** Updates a tag's total chunks count. */
export async function updateTag(requestOptions: BeeRequestOptions, uid: number, reference: Reference): Promise<void> {
  await http<void>(requestOptions, {
    method: 'patch',
    url: `${endpoint}/${uid}`,
    data: { reference },
  })
}
