import type { PhotoItem, UiTag } from '@/types/gallery'
import { normalizeTag, prettyTag } from './strings'

export const computeTagCatalog = (list: PhotoItem[]): UiTag[] => {
  const stats = new Map<string, UiTag>()
  list.forEach((it) => {
    (it.tags ?? []).forEach((raw) => {
      const norm = normalizeTag(raw)
      if (!norm) return
      const label = prettyTag(raw)
      const prev = stats.get(norm)
      if (prev) {
        prev.count += 1
        if (label.length > prev.label.length) prev.label = label
      } else {
        stats.set(norm, { norm, label, count: 1 })
      }
    })
  })
  return Array.from(stats.values()).sort((a, b) => b.count - a.count)
}

export { normalizeTag, prettyTag }
