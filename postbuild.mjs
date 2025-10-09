// postbuild.mjs
import { writeFileSync } from 'fs';
import { join } from 'path';

// genera timestamp actual
const timestamp = Date.now().toString();

// ruta del dist/meta.json
const metaPath = join('dist', 'meta.json');

// escribe el archivo
writeFileSync(metaPath, JSON.stringify({ build: timestamp }), 'utf8');

console.log(`✅ meta.json generado con build: ${timestamp}`);
