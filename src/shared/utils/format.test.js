import { describe, expect, it } from 'vitest'
import { formatDateTime, formatElapsedMs, formatPhone } from './format'

describe('formatElapsedMs', () => {
  it('renders raw milliseconds as seconds with 3 decimals', () => {
    expect(formatElapsedMs(43821)).toBe('43.821초')
  })

  it('falls back to a dash for null/undefined', () => {
    expect(formatElapsedMs(null)).toBe('-')
    expect(formatElapsedMs(undefined)).toBe('-')
  })
})

describe('formatPhone', () => {
  it('inserts hyphens into a normalized 11-digit number', () => {
    expect(formatPhone('01012345678')).toBe('010-1234-5678')
  })

  it('returns non-11-digit input unchanged', () => {
    expect(formatPhone('021234567')).toBe('021234567')
  })

  it('falls back to a dash for null/empty', () => {
    expect(formatPhone(null)).toBe('-')
    expect(formatPhone('')).toBe('-')
  })
})

describe('formatDateTime', () => {
  it('falls back to a dash when there is no timestamp', () => {
    expect(formatDateTime(null)).toBe('-')
    expect(formatDateTime(undefined)).toBe('-')
  })

  it('formats a valid ISO string without throwing', () => {
    expect(formatDateTime('2026-09-11T09:12:00')).toEqual(expect.any(String))
  })
})
