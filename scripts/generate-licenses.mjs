import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'))
const projectLicense = readFileSync(join(root, 'LICENSE.md'), 'utf-8')

const dependencies = []
for (const name of Object.keys(pkg.dependencies || {})) {
  try {
    const depPkg = JSON.parse(
      readFileSync(join(root, 'node_modules', name, 'package.json'), 'utf-8')
    )
    const url =
      depPkg.homepage ||
      (typeof depPkg.repository === 'string'
        ? depPkg.repository
        : depPkg.repository?.url?.replace(/^git\+/, '').replace(/\.git$/, '')) ||
      ''
    dependencies.push({
      name: depPkg.name,
      version: depPkg.version,
      license: depPkg.license || 'Unknown',
      url
    })
  } catch {
    dependencies.push({ name, version: 'unknown', license: 'Unknown', url: '' })
  }
}

dependencies.sort((a, b) => a.name.localeCompare(b.name))

const outDir = join(root, 'src', 'renderer', 'src', 'generated')
mkdirSync(outDir, { recursive: true })
writeFileSync(
  join(outDir, 'about-data.json'),
  JSON.stringify({ projectLicense, dependencies }, null, 2) + '\n'
)

console.log(`Generated about-data.json with ${dependencies.length} dependencies`)
