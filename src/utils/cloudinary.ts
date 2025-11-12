import type { PhotoItem } from '@/types/gallery'

const cloudFromUrl = (url?: string) => {
  if (!url) return undefined
  const m = url.match(/res\.cloudinary\.com\/([^/]+)\/image\/upload\//i)
  return m?.[1]
}

export const toShareUrl = (url: string, publicId?: string, w = 1200) => {
  let cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
  if (!cloud && url) cloud = cloudFromUrl(url)
  const base = cloud ? `https://res.cloudinary.com/${cloud}/image/upload` : ''
  const common = `f_auto,q_auto,dpr_auto,c_limit,w_${w}`
  if (cloud && publicId) return `${base}/${common}/${publicId}`

  const cleanNoQS = url.split('?')[0]
  const cleaned = cleanNoQS
    .replace(/\/upload\/([^/]*,)?fl_attachment[^/]*\//i, '/upload/')
    .replace(/\/upload\/([^/]*,)?attachment[^/]*\//i, '/upload/')
  if (cleaned.includes('/image/upload/')) {
    return cleaned.replace('/upload/', `/upload/${common}/`)
  }
  return cleaned
}

export const clTransform = (url: string, publicId?: string, h = 420) => {
  let cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
  if (!cloud && url) cloud = cloudFromUrl(url)
  if (cloud && publicId) {
    return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,h_${h},c_limit/${publicId}`
  }
  if (url?.includes('/image/upload/')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,h_${h},c_limit/`)
  }
  return url
}

export const clLarge = (url: string, publicId?: string) => clTransform(url, publicId, 1600)

export const buildWA = (phone: string, item: PhotoItem, imgUrl: string) => {
  const share = toShareUrl(imgUrl, item.publicId)
  const base = `https://wa.me/${phone}`
  const msg = `Hola, deseo más info de esta torta:\n${share}`
  return `${base}?text=${encodeURIComponent(msg)}`
}
