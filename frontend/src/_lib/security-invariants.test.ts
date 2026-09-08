import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])

function filesUnder(directory: string): string[] {
  return readdirSync(directory).flatMap(name => {
    const path = join(directory, name)
    return statSync(path).isDirectory()
      ? filesUnder(path)
      : sourceExtensions.has(extname(path)) ? [path] : []
  })
}

describe('security source invariants', () => {
  it('does not log authentication material or build JWT-bearing URLs', () => {
    const source = filesUnder(resolve(process.cwd(), 'src'))
      .map(path => readFileSync(path, 'utf8'))
      .join('\n')

    expect(source).not.toMatch(/console\.(?:log|debug|info|warn|error)\([^\n]*(?:authorization|cookie|password|jwt)/i)
    expect(source).not.toMatch(/profilepicture\/\$?\{?(?:jwt|token)/i)
    expect(source).not.toMatch(/[?&](?:jwt|access_token)=/i)
  })

  it('does not print environment files in CI', () => {
    const workflowDirectory = resolve(process.cwd(), '..', '.github', 'workflows')
    const workflows = readdirSync(workflowDirectory)
      .map(name => readFileSync(join(workflowDirectory, name), 'utf8'))
      .join('\n')

    expect(workflows).not.toMatch(/\b(?:cat|type|Get-Content)\s+[^\n]*(?:\.env|appsettings\.Secrets)/i)
  })
})
