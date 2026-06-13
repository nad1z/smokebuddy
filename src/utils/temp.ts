export function fToC(f: number): number {
  return Math.round(((f - 32) * 5) / 9)
}

export function cToF(c: number): number {
  return Math.round((c * 9) / 5 + 32)
}

export function displayTemp(tempF: number, unit: 'F' | 'C'): string {
  const value = unit === 'C' ? fToC(tempF) : tempF
  return `${value}°${unit}`
}
