import { defineConfig } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';
import replace from '@rollup/plugin-replace';

export default defineConfig({
  input: 'sidepanel/index.js',
  output: {
    dir: 'dist/sidepanel',
    format: 'es'
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    replace({
      preventAssignment: true,
      values: {
        'process.env.GOOGLE_API_KEY': JSON.stringify(process.env.GOOGLE_API_KEY)
      }
    }),
    copy({
      targets: [
        {
          src: ['manifest.json', 'background.js', 'sidepanel', 'images'],
          dest: 'dist'
        }
      ]
    })
  ]
});
