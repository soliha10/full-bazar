/**
 * Mahsulotning o'z xotira konfiguratsiyasi — nomining oxiridan ("… 8/256 GB",
 * "… 128 GB", "… 1 TB"). Backend dagi python/fastapi_app/spec_payload.py
 * (_OWN_MEMORY) bilan bir xil qoida: nomda yo'q bo'lsa — hech narsa (taxmin yo'q).
 */
const OWN_MEMORY = /(?:(\d+)\s*\/\s*)?(\d+)\s*(GB|TB)\s*$/i;

export function memoryFromName(name: string): { ram: string | null; storage: string | null } {
  const m = OWN_MEMORY.exec((name || '').trim());
  if (!m) return { ram: null, storage: null };
  return { ram: m[1] ? `${m[1]} GB` : null, storage: `${m[2]} ${m[3].toUpperCase()}` };
}

/** Nomdan xotira qismi olib tashlangan — xotira kartada chip bo'lib turganda takrorlanmasin */
export function nameWithoutMemory(name: string): string {
  const short = (name || '').trim().replace(OWN_MEMORY, '').trim();
  return short || name;
}
