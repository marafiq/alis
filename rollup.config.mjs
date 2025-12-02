import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  fs.readFileSync(path.join(dirname, 'package.json'), 'utf8')
);

const input = path.join(dirname, 'src/index.js');
const banner = `/*! ${pkg.name} v${pkg.version} | ${pkg.license} */`;

const basePlugins = [
  nodeResolve({ browser: true, preferBuiltins: false }),
  commonjs(),
  json()
];

/** @type {import('rollup').RollupOptions[]} */
const config = [
  {
    input,
    output: [
      {
        file: 'dist/alis.esm.js',
        format: 'esm',
        sourcemap: true,
        banner
      },
      {
        file: 'dist/alis.cjs.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
        banner
      }
    ],
    plugins: basePlugins
  },
  {
    input,
    output: {
      file: 'dist/alis.js',
      format: 'iife',
      name: 'ALIS',
      exports: 'named',
      sourcemap: true,
      banner
    },
    plugins: basePlugins
  },
  {
    input,
    output: {
      file: 'dist/alis.min.js',
      format: 'iife',
      name: 'ALIS',
      exports: 'named',
      sourcemap: true,
      banner
    },
    plugins: [...basePlugins, terser({ format: { comments: /^!/ } })]
  }
];

export default config;

