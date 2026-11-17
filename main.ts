// main.ts — hands in this make.fun frontend entry.
//
// Copies app/ and screenshots/ from this repository into the output
// directory (MAKEFUN_OUTPUT_DIR when set, else /output, where the grader
// runs it) and writes dossier.json there with the kit's dossier library,
// so the dossier describes exactly the files handed in.

import {
  cpSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
// Clear the two copied trees first, so a file removed from the repository
// can never linger in the output and slip into the dossier.
for (const name of ['app', 'screenshots']) {
  const target = join(outDir, name);
  rmSync(target, { recursive: true, force: true });
  cpSync(join(repoRoot, name), target, { recursive: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 3, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

const count = (dir: string): number =>
  readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) =>
    e.isFile(),
  ).length;
console.log(
  `handed in ${count(join(outDir, 'app'))} app files and ` +
    `${count(join(outDir, 'screenshots'))} screenshots; ` +
    `dossier.json is ${dossier.length} bytes`,
);
