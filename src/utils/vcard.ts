import type { Branch } from '@/types'

function escape(text: string) {
  return text.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

export function buildBranchVCard(branch: Branch): string {
  const org = 'Pastelería Maktub' // TODO: cambia el nombre aquí si es otro
  const name = `${branch.name}`
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escape(org + ' · ' + name)}`,
    `ORG:${escape(org)}`,
    branch.phone ? `TEL;TYPE=WORK,VOICE:${branch.phone}` : '',
    branch.whatsapp ? `TEL;TYPE=CELL,VOICE:${branch.whatsapp}` : '',
    branch.email ? `EMAIL;TYPE=WORK:${branch.email}` : '',
    `ADR;TYPE=WORK:;;${escape(branch.address)};${escape(branch.city)};;`,
    branch.mapsUrl ? `URL:${escape(branch.mapsUrl)}` : '',
    'END:VCARD'
  ].filter(Boolean)
  return lines.join('\n')
}

export function downloadVCard(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.vcf') ? filename : filename + '.vcf'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
