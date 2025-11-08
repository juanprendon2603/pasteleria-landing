'use client'

import { db } from '@/firebase/config'
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { motion } from 'framer-motion'
import {
  FolderPlus,
  ImagePlus,
  Loader2,
  Rocket,
  Tag,
  Upload,
} from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// === Ajustes de compresión en cliente ===
const MAX_WIDTH = 1600 // px (redimensiona manteniendo proporción si es mayor)
const QUALITY = 0.82 // 0..1 (solo aplica a JPEG/WebP)
const CONCURRENCY = 8 // subidas simultáneas para la carga masiva

type Category = {
  id: string
  name: string
}

type LocalFile = {
  file: File
  preview: string
}

export default function GalleryAdmin() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [title, setTitle] = useState('') // título base (opcional) para todos
  const [files, setFiles] = useState<LocalFile[]>([])
  const [loading, setLoading] = useState(false)

  // Drag & Drop (sección normal)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const dropRef = useRef<HTMLDivElement | null>(null)

  // ====== NUEVA SECCIÓN: CARGA MASIVA ======
  const [bulkFiles, setBulkFiles] = useState<LocalFile[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkDragActive, setBulkDragActive] = useState(false)
  const bulkInputRef = useRef<HTMLInputElement | null>(null)
  const bulkDropRef = useRef<HTMLDivElement | null>(null)
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 })

  // Cargar categorías al montar (para la sección normal)
  useEffect(() => {
    const fetchCategories = async () => {
      const snap = await getDocs(collection(db, 'categories'))
      setCategories(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    }
    fetchCategories()
  }, [])

  // Limpieza de object URLs
  useEffect(
    () => () => files.forEach((f) => URL.revokeObjectURL(f.preview)),
    [files],
  )
  useEffect(
    () => () => bulkFiles.forEach((f) => URL.revokeObjectURL(f.preview)),
    [bulkFiles],
  )

  // Crear categoría
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.trim()) return
    await addDoc(collection(db, 'categories'), { name: newCategory })
    setNewCategory('')
    alert('Categoría creada ✅')
  }

  // Utilidad: comprime/redimensiona (JPG/PNG/WebP). HEIC se devuelve tal cual.
  const compressImage = async (file: File): Promise<File> => {
    const isImage = file.type.startsWith('image/')
    const isHeic = /heic/i.test(file.type) || /\.heic$/i.test(file.name)
    if (!isImage || isHeic) return file // no tocamos HEIC (Cloudinary lo maneja al servir)
    if (file.size <= 3 * 1024 * 1024) return file // <3MB, súbelo directo

    const bitmap = await createImageBitmap(file)
    const ratio = bitmap.width / bitmap.height
    const targetW = Math.min(MAX_WIDTH, bitmap.width)
    const targetH = Math.round(targetW / ratio)

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0, targetW, targetH)

    const outMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b as Blob), outMime, QUALITY),
    )

    const newName =
      file.name.replace(/\.\w+$/, '') +
      (outMime === 'image/png' ? '.png' : '.jpg')
    return new File([blob], newName, { type: outMime })
  }

  // Util: convertir lista a LocalFile[]
  const mapToLocalFiles = (fileList: FileList | File[]) => {
    const arr = Array.from(fileList)
    return arr
      .filter((f) => f.type.startsWith('image/'))
      .map((f) => ({ file: f, preview: URL.createObjectURL(f) }))
  }

  // Añadir (normal)
  const addFiles = (incoming: FileList | File[]) => {
    const mapped = mapToLocalFiles(incoming)
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => `${f.file.name}-${f.file.size}`))
      const unique = mapped.filter(
        (f) => !existing.has(`${f.file.name}-${f.file.size}`),
      )
      return [...prev, ...unique]
    })
  }

  // Añadir (bulk)
  const addBulkFiles = (incoming: FileList | File[]) => {
    const mapped = mapToLocalFiles(incoming)
    setBulkFiles((prev) => {
      const existing = new Set(prev.map((f) => `${f.file.name}-${f.file.size}`))
      const unique = mapped.filter(
        (f) => !existing.has(`${f.file.name}-${f.file.size}`),
      )
      return [...prev, ...unique]
    })
  }

  // Drag & Drop handlers (normal)
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
    e.dataTransfer.dropEffect = 'copy'
  }, [])
  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Node))
      setDragActive(false)
  }, [])
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files)
      e.dataTransfer.clearData()
    }
  }, [])

  // Drag & Drop handlers (bulk)
  const onBulkDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setBulkDragActive(true)
    e.dataTransfer.dropEffect = 'copy'
  }, [])
  const onBulkDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setBulkDragActive(true)
  }, [])
  const onBulkDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (
      bulkDropRef.current &&
      !bulkDropRef.current.contains(e.relatedTarget as Node)
    )
      setBulkDragActive(false)
  }, [])
  const onBulkDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setBulkDragActive(false)
    if (e.dataTransfer.files?.length) {
      addBulkFiles(e.dataTransfer.files)
      e.dataTransfer.clearData()
    }
  }, [])

  // Paste para ambas (Cmd/Ctrl+V)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const list = Array.from(e.clipboardData?.files || [])
      if (!list.length) return
      // por defecto mandémoslo a la masiva si está abierta (tiene foco)
      addBulkFiles(list)
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  const openFilePicker = () => inputRef.current?.click()
  const openBulkFilePicker = () => bulkInputRef.current?.click()

  // Subida normal (con título/categoría/tags)
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!files.length || !category)
      return alert('Selecciona categoría y al menos 1 archivo')
    setLoading(true)

    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
      const uploadPreset = import.meta.env
        .VITE_CLOUDINARY_UNSIGNED_PRESET as string
      if (!cloudName || !uploadPreset)
        throw new Error('Faltan VITE_CLOUDINARY_* en .env')

      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      let success = 0

      for (const lf of files) {
        const original = lf.file
        const toUpload = await compressImage(original)

        const form = new FormData()
        form.append('file', toUpload)
        form.append('upload_preset', uploadPreset)
        form.append('folder', `pasteleria/gallery/${category}`)
        if (tagList.length) form.append('tags', tagList.join(','))
        const baseTitle = title?.trim()
        const thisTitle = baseTitle || original.name
        if (thisTitle)
          form.append('context', `caption=${thisTitle}|alt=${thisTitle}`)

        // 👇 añade esto:
        form.append('return_delete_token', '1')

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: 'POST', body: form },
        )
        if (!res.ok) {
          console.error('Cloudinary error:', await res.text())
          continue
        }
        const data = await res.json()
        const imageUrl = data.secure_url as string
        const publicId = data.public_id as string
        const deleteToken = data.delete_token as string | undefined // 👈

        await addDoc(collection(db, 'gallery'), {
          title: thisTitle,
          imageUrl,
          publicId,
          deleteToken, // 👈 NUEVO
          category,
          tags: tagList,
          createdAt: serverTimestamp(),
        })

        success++
      }

      files.forEach((f) => URL.revokeObjectURL(f.preview))
      setFiles([])
      setTitle('')
      setTags('')
      setCategory('')
      alert(`Se subieron ${success} imagen(es) con éxito 🎉`)
    } catch (err) {
      console.error(err)
      alert('Error al subir imágenes 😢')
    } finally {
      setLoading(false)
    }
  }

  // ====== SUBIDA MASIVA (sin título/categoría/tags) ======
  // helper para procesar en bloques concurrentes
  const chunked = <T,>(arr: T[], size: number) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size),
    )

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bulkFiles.length) return alert('Agrega al menos 1 imagen')

    setBulkLoading(true)
    setBulkProgress({ done: 0, total: bulkFiles.length })

    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string
      const uploadPreset = import.meta.env
        .VITE_CLOUDINARY_UNSIGNED_PRESET as string
      if (!cloudName || !uploadPreset)
        throw new Error('Faltan VITE_CLOUDINARY_* en .env')

      let uploaded = 0
      const chunks = chunked(bulkFiles, CONCURRENCY)

      for (const group of chunks) {
        await Promise.all(
          group.map(async (lf) => {
            try {
              const toUpload = await compressImage(lf.file)
              const form = new FormData()
              form.append('file', toUpload)
              form.append('upload_preset', uploadPreset)
              // carpeta fija para masivos
              form.append('folder', `pasteleria/gallery/bulk`)
              form.append('return_delete_token', '1')

              const res = await fetch(
                `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                {
                  method: 'POST',
                  body: form,
                },
              )
              if (!res.ok) {
                console.error('Cloudinary error:', await res.text())
                return
              }

              const data = await res.json()
              const imageUrl = data.secure_url as string
              const publicId = data.public_id as string
              const deleteToken = data.delete_token as string | undefined // 👈

              // Guardar con campos vacíos
              await addDoc(collection(db, 'gallery'), {
                title: '',
                imageUrl,
                publicId,
                deleteToken, // 👈 NUEVO
                category: '',
                tags: [],
                createdAt: serverTimestamp(),
              })
            } catch (e) {
              console.error('error grupo masivo:', e)
            } finally {
              uploaded++
              setBulkProgress((p) => ({ ...p, done: uploaded }))
            }
          }),
        )
      }

      bulkFiles.forEach((f) => URL.revokeObjectURL(f.preview))
      setBulkFiles([])
      alert(`Carga masiva lista: ${uploaded}/${bulkFiles.length} imágenes ✅`)
    } catch (err) {
      console.error(err)
      alert('Error en carga masiva 😢')
    } finally {
      setBulkLoading(false)
    }
  }

  const totalSize = useMemo(
    () => files.reduce((acc, f) => acc + f.file.size, 0),
    [files],
  )
  const bulkTotalSize = useMemo(
    () => bulkFiles.reduce((acc, f) => acc + f.file.size, 0),
    [bulkFiles],
  )

  return (
    <section className="section admin-gallery">
      <div className="container">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="h2"
        >
          Panel de Galería
        </motion.h2>
        <p className="lead">Agrega categorías y sube fotos de pedidos</p>

        {/* Crear categoría */}
        <form onSubmit={handleAddCategory} className="admin-card">
          <h3>
            <FolderPlus size={18} /> Nueva categoría
          </h3>
          <div className="input-group">
            <input
              type="text"
              placeholder="Ej: Tortas Infantiles"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button type="submit" className="btn">
              Crear
            </button>
          </div>
        </form>

        {/* Subir imágenes (múltiples) con Drag & Drop - NORMAL */}
        <form onSubmit={handleUpload} className="admin-card">
          <h3>
            <ImagePlus size={18} /> Subir imágenes
          </h3>

          <div className="grid cols-2">
            <div className="input-wrap">
              <label>Título base (opcional)</label>
              <input
                type="text"
                placeholder="Ej: Torta de unicornio"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <small className="muted">
                Si lo dejas vacío, se usará el nombre del archivo.
              </small>
            </div>

            <div className="input-wrap">
              <label>Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Selecciona categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-wrap">
            <label>
              <Tag size={14} /> Etiquetas (separadas por coma)
            </label>
            <input
              type="text"
              placeholder="Ej: chocolate, fondant, cumpleaños"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          {/* DROPZONE NORMAL */}
          <div
            ref={dropRef}
            className={`upload-zone ${dragActive ? 'drag' : ''}`}
            onDragOver={onDragOver}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()
            }
            aria-label="Soltar o seleccionar imágenes"
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const fl = Array.from(e.target.files || [])
                if (fl.length) addFiles(fl)
                if (inputRef.current) inputRef.current.value = ''
              }}
            />
            <div className="drop-inner">
              <Upload />
              <p className="drop-title">Arrastra y suelta tus imágenes aquí</p>
              <p className="muted">o haz clic para seleccionarlas</p>
            </div>

            {files.length > 0 && (
              <>
                <div className="preview-grid">
                  {files.map((f, i) => (
                    <div
                      className="thumb"
                      key={`${f.file.name}-${i}`}
                      title={f.file.name}
                    >
                      <img src={f.preview} alt={`Preview ${i + 1}`} />
                      <small>
                        {(f.file.size / (1024 * 1024)).toFixed(2)} MB
                      </small>
                    </div>
                  ))}
                </div>
                <div className="muted total">
                  Total seleccionado: {(totalSize / (1024 * 1024)).toFixed(2)}{' '}
                  MB
                </div>
              </>
            )}
          </div>

          <button
            type="submit"
            className="btn upload-btn"
            disabled={loading || !files.length}
          >
            {loading ? <Loader2 className="spin" /> : <Upload />} Subir{' '}
            {files.length ? `(${files.length})` : ''}
          </button>
        </form>

        {/* ====== NUEVA SECCIÓN: CARGA MASIVA ====== */}
        <form onSubmit={handleBulkUpload} className="admin-card">
          <h3>
            <Rocket size={18} /> Carga masiva (sin título, sin categoría, sin
            tags)
          </h3>
          <p className="muted" style={{ marginTop: -6 }}>
            Sube todas tus imágenes “tal cual”. Se guardan vacías y se organizan
            en Cloudinary en <code>pasteleria/gallery/bulk</code>.
          </p>

          <div
            ref={bulkDropRef}
            className={`upload-zone ${bulkDragActive ? 'drag' : ''}`}
            onDragOver={onBulkDragOver}
            onDragEnter={onBulkDragEnter}
            onDragLeave={onBulkDragLeave}
            onDrop={onBulkDrop}
            onClick={openBulkFilePicker}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              (e.key === 'Enter' || e.key === ' ') && openBulkFilePicker()
            }
            aria-label="Soltar o seleccionar imágenes (carga masiva)"
          >
            <input
              ref={bulkInputRef}
              type="file"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const fl = Array.from(e.target.files || [])
                if (fl.length) addBulkFiles(fl)
                if (bulkInputRef.current) bulkInputRef.current.value = ''
              }}
            />

            <div className="drop-inner">
              <Upload />
              <p className="drop-title">
                Suelta aquí (o haz clic) para carga masiva
              </p>
              <p className="muted">Se suben directamente sin metadatos</p>
            </div>

            {bulkFiles.length > 0 && (
              <>
                <div className="preview-grid">
                  {bulkFiles.map((f, i) => (
                    <div
                      className="thumb"
                      key={`${f.file.name}-${i}`}
                      title={f.file.name}
                    >
                      <img src={f.preview} alt={`Bulk ${i + 1}`} />
                      <small>
                        {(f.file.size / (1024 * 1024)).toFixed(2)} MB
                      </small>
                    </div>
                  ))}
                </div>
                <div className="muted total">
                  Total seleccionado:{' '}
                  {(bulkTotalSize / (1024 * 1024)).toFixed(2)} MB
                </div>
              </>
            )}
          </div>

          {/* Barra de progreso simple */}
          {bulkLoading && (
            <div className="muted" style={{ margin: '8px 0' }}>
              Subiendo... {bulkProgress.done}/{bulkProgress.total}
              <div
                style={{
                  height: 8,
                  background: '#eee',
                  borderRadius: 6,
                  overflow: 'hidden',
                  marginTop: 6,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${bulkProgress.total ? (bulkProgress.done / bulkProgress.total) * 100 : 0}%`,
                    background: '#6366f1',
                    transition: 'width .2s ease',
                  }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn upload-btn"
            disabled={bulkLoading || !bulkFiles.length}
          >
            {bulkLoading ? <Loader2 className="spin" /> : <Upload />} Subir
            masivo {bulkFiles.length ? `(${bulkFiles.length})` : ''}
          </button>
        </form>
      </div>

      <style>{`
        .admin-card {
          background: #fff;
          padding: 1.5rem;
          border-radius: 16px;
          margin-top: 1.5rem;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
        }
        h3 {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }
        .input-group { display: flex; gap: 0.5rem; }
        .input-group input {
          flex: 1; padding: 0.6rem 0.8rem; border-radius: 8px; border: 1px solid #ddd;
        }
        .input-wrap { margin-bottom: 0.8rem; display: flex; flex-direction: column; }
        .input-wrap input, .input-wrap select {
          padding: 0.6rem 0.8rem; border-radius: 8px; border: 1px solid #ddd;
        }
        .upload-zone {
          margin: 1rem 0; border: 2px dashed #ccc; border-radius: 12px; padding: 1rem; text-align: center;
          transition: all .15s ease-in-out; cursor: pointer; outline: none;
        }
        .upload-zone:hover, .upload-zone:focus { border-color: #aaa; }
        .upload-zone.drag { border-color: #6366f1; background: #f8f9ff; }
        .drop-inner { display: grid; place-items: center; gap: 6px; color: #374151; }
        .drop-title { margin: 0; font-weight: 600; }
        .preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; margin-top: 12px; }
        .thumb {
          background: #fafafa; border: 1px solid #eee; border-radius: 10px; padding: 6px;
          display: flex; flex-direction: column; gap: 6px; align-items: center; justify-content: center;
        }
        .thumb img { width: 100%; height: 90px; object-fit: cover; border-radius: 6px; }
        .muted { color: #6b7280; font-size: 12px; }
        .total { margin-top: 6px; }
        .upload-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </section>
  )
}
