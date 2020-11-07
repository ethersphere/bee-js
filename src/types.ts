export interface Dictionary<T> {
  [Key: string]: T
}

export interface OptionsUpload {
  name?: string
  pin?: boolean
  encrypt?: boolean
  tag?: number
  size?: number // Content length, required if the uploaded data is readable stream
}

export interface Tag {
  total: number
  split: number
  seen: number
  stored: number
  sent: number
  synced: number
  uid: number
  name: string
  address: string
  startedAt: string
}
