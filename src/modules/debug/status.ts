import { safeAxios } from '../../utils/safeAxios'
import type { Health, BeeVersion } from '../../types/debug'

const GITHUB_API_URL = 'https://api.github.com/repos/ethersphere/bee'

/**
 * Get health of node
 *
 * @param url Bee debug URL
 *
 * @returns Health of the bee node and version
 */
export async function getHealth(url: string): Promise<Health> | never {
  const response = await safeAxios<Health>({
    method: 'get',
    url: `${url}/health`,
    responseType: 'json',
  })

  return response.data
}

interface GithubReleaseResponse {
  html_url: string
  tag_name: string
  draft: boolean
  prerelease: boolean
  published_at: string
}

/**
 * Get all published Bee versions from github
 *
 * @returns List of published and released Bee versions
 */
export async function getBeeVersions(): Promise<BeeVersion[]> {
  const response = await safeAxios<GithubReleaseResponse[]>({
    method: 'get',
    url: `${GITHUB_API_URL}/releases`,
    responseType: 'json',
  })

  return response.data
    .filter(v => !v.prerelease && !v.draft) // we want only published versions
    .map(v => ({ version: v.tag_name, date: v.published_at, url: v.html_url }))
}

/**
 * Get latest released Bee versions from github
 *
 * @returns Latest released Bee version
 */
export async function getBeeVersionLatest(): Promise<BeeVersion> {
  const response = await safeAxios<GithubReleaseResponse>({
    method: 'get',
    url: `${GITHUB_API_URL}/releases/latest`,
    responseType: 'json',
  })

  return { version: response.data.tag_name, date: response.data.published_at, url: response.data.html_url }
}
