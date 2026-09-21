import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

describe('PWA source config', () => {
  it('starts the install experience at admin without caching API responses', () => {
    const config = readFileSync(join(root, 'vite.config.js'), 'utf8')
    const html = readFileSync(join(root, 'index.html'), 'utf8')

    expect(html).toContain('viewport-fit=cover')
    expect(config).toContain("start_url: '/admin'")
    expect(config).toContain("display: 'standalone'")
    expect(config).toContain("handler: 'NetworkOnly'")
    expect(config).toContain('/^\\/api\\//')
  })

  it('uses checked-in brand icons for install metadata', () => {
    expect(existsSync(join(root, 'public/icons/admin-pwa-192.png'))).toBe(true)
    expect(existsSync(join(root, 'public/icons/admin-pwa-512.png'))).toBe(true)
    expect(
      existsSync(join(root, 'public/icons/admin-pwa-maskable-512.png')),
    ).toBe(true)
  })
})
