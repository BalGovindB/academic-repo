// Reads one line of JSON on stdin and writes it with one record per line,
// so that src/data/repository.json is readable and diff-friendly.
import { readFileSync } from 'node:fs'

const data = JSON.parse(readFileSync(0, 'utf8'))
const lines = ['{']
const keys = Object.keys(data)
keys.forEach((key, i) => {
  const rows = data[key]
  lines.push(`  "${key}": [`)
  rows.forEach((row, j) => lines.push('    ' + JSON.stringify(row) + (j < rows.length - 1 ? ',' : '')))
  lines.push('  ]' + (i < keys.length - 1 ? ',' : ''))
})
lines.push('}')
process.stdout.write(lines.join('\n') + '\n')
