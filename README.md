# Landing Pastelería (React + Vite + TS)

Estructura senior por componentes (Header, Hero, Locations con guardado de contacto vía vCard, SocialLinks, Footer).

## 🚀 Cómo correr
```bash
npm install
npm run dev
# build prod
npm run build
npm run preview
```

## ✏️ Personaliza datos
- Edita `src/components/Locations.tsx` para cambiar dirección, teléfonos y WhatsApp de cada sede.
- Edita `src/components/SocialLinks.tsx` para tus redes.
- Cambia el nombre de la pastelería en `src/utils/vcard.ts` (const `org`).

## 💾 Guardar contacto
- Botón **Guardar contacto** genera y descarga un `.vcf` estándar (vCard 3.0) para la sede.
- **Abrir en Maps** lleva al link de Google Maps configurado en cada sede.

## 🧪 Accesibilidad y buenas prácticas
- Componentes con IDs, labels y semantics básicos.
- Tipado con TypeScript, path alias `@/*`.
- Sin dependencias UI para que luego diseñemos sin restricciones.
