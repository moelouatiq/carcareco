import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const normalizeCss = (css: string) => css.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')

const frontendCss = normalizeCss(readFileSync(join(process.cwd(), 'src/_styles/print.css'), 'utf8'))
const backendCss = normalizeCss(readFileSync(
  join(process.cwd(), '../backend/src/Carmasters.Http.Api/wwwroot/print.css'),
  'utf8',
))

describe('browser print styles', () => {
  it('stay synchronized with the backend PDF styles', () => {
    expect(frontendCss).toBe(backendCss)
  })

  it.each(['.doc-head', '.doc-parties', '.doc-table', '.doc-totals', '.doc-notes', '.doc-foot'])(
    'style the structural selector %s',
    selector => {
      expect(frontendCss).toContain(selector)
    },
  )
})
