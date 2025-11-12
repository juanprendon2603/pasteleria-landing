export type PhotoItem = {
  id: string
  title?: string
  imageUrl: string
  publicId?: string
  category: string
  tags: string[]
  tagsNorm?: string[]
  createdAt?: string | number
  description?: string
  author?: string
  deleteToken?: string
}

export type Branch = {
  id: string
  name: string
  phone: string
}

export type UiTag = { norm: string; label: string; count: number }

export type CategoryDoc = { name?: string }

export type FirestoreGalleryData = {
  title?: string
  imageUrl?: string
  publicId?: string
  deleteToken?: string
  category?: string
  tags?: unknown
  createdAt?: number | string | { toMillis?: () => number }
  description?: string
  author?: string
}
