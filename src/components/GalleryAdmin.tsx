'use client'

import { db, storage } from '@/firebase/config' // 👈 crea este archivo si aún no lo tienes
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { motion } from 'framer-motion'
import { FolderPlus, ImagePlus, Loader2, Tag, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'

type Category = {
  id: string
  name: string
}

export default function GalleryAdmin() {
  const [categories, setCategories] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  // Cargar categorías al montar
  useEffect(() => {
    const fetchCategories = async () => {
      const snap = await getDocs(collection(db, 'categories'))
      setCategories(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    }
    fetchCategories()
  }, [])

  // Crear categoría
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategory.trim()) return
    await addDoc(collection(db, 'categories'), { name: newCategory })
    setNewCategory('')
    alert('Categoría creada ✅')
  }

  // Subir imagen a Firebase Storage + guardar en Firestore
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !category) return alert('Selecciona categoría y archivo')

    setLoading(true)
    try {
      const fileRef = ref(storage, `gallery/${Date.now()}_${file.name}`)
      await uploadBytes(fileRef, file)
      const url = await getDownloadURL(fileRef)

      await addDoc(collection(db, 'gallery'), {
        title: title || file.name,
        imageUrl: url,
        category,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        createdAt: serverTimestamp(),
      })

      setFile(null)
      setTitle('')
      setTags('')
      setCategory('')
      setPreview(null)
      alert('Imagen subida con éxito 🎉')
    } catch (err) {
      console.error(err)
      alert('Error al subir imagen 😢')
    } finally {
      setLoading(false)
    }
  }

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

        {/* Subir imagen */}
        <form onSubmit={handleUpload} className="admin-card">
          <h3>
            <ImagePlus size={18} /> Subir imagen
          </h3>
          <div className="grid cols-2">
            <div className="input-wrap">
              <label>Título</label>
              <input
                type="text"
                placeholder="Ej: Torta de unicornio"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
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

          <div className="upload-zone">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) {
                  setFile(f)
                  setPreview(URL.createObjectURL(f))
                }
              }}
            />
            {preview && <img src={preview} alt="Preview" className="preview" />}
          </div>

          <button type="submit" className="btn upload-btn" disabled={loading}>
            {loading ? <Loader2 className="spin" /> : <Upload />} Subir
          </button>
        </form>
      </div>

      <style jsx>{`
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
        .input-group {
          display: flex;
          gap: 0.5rem;
        }
        .input-group input {
          flex: 1;
          padding: 0.6rem 0.8rem;
          border-radius: 8px;
          border: 1px solid #ddd;
        }
        .input-wrap {
          margin-bottom: 0.8rem;
          display: flex;
          flex-direction: column;
        }
        .input-wrap input,
        .input-wrap select {
          padding: 0.6rem 0.8rem;
          border-radius: 8px;
          border: 1px solid #ddd;
        }
        .upload-zone {
          margin: 1rem 0;
          border: 2px dashed #ccc;
          border-radius: 12px;
          padding: 1rem;
          text-align: center;
        }
        .upload-zone input {
          display: block;
          margin: 0 auto;
        }
        .preview {
          margin-top: 0.8rem;
          max-width: 200px;
          border-radius: 12px;
        }
        .upload-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </section>
  )
}
