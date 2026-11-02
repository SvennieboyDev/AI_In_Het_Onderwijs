export const maakId = (voorvoegsel: string) => `${voorvoegsel}-${crypto.randomUUID().slice(0, 8)}`

/** Volgende vrije leerlingcode, bv. L001, L002 ... */
export function volgendeCode(bestaand: Iterable<string>, voorvoegsel = 'L'): string {
  const gebruikt = new Set(bestaand)
  for (let i = 1; ; i++) {
    const code = `${voorvoegsel}${String(i).padStart(3, '0')}`
    if (!gebruikt.has(code)) return code
  }
}

/** Haalt een leerlingcode uit een bestandsnaam, bv. "L023_essay.jpg" of "123456.pdf". */
export function codeUitBestandsnaam(naam: string): string | null {
  const basis = naam.replace(/\.[^.]+$/, '')
  // Standaardnamen van camera's en scanapps zijn geen leerlingcode
  if (/^(img|dsc|pxl|photo|foto|scan|whatsapp|image)/i.test(basis)) return null
  const match = /(?:^|[^A-Za-z0-9])([A-Za-z]{0,2}\d{3,7})(?=$|[^A-Za-z0-9])/.exec(basis)
  return match ? match[1].toUpperCase() : null
}
