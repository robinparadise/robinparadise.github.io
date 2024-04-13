import { nodeResolve } from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import css from 'rollup-plugin-import-css'

process.env.BUILD === 'production'

export default {
  input: [
    'src/js/index.js'
  ],
  output: {
    dir: "www/assets",
    format: "es",
    compact: true,
    chunkFileNames: "[name]-[hash].js",
    name: 'lit-index-[hash].js',
  },
  experimentalCodeSplitting: true,
  plugins: [
    css(),
    nodeResolve(),
    terser({
      output: {
        comments: false
      }
    })
  ]
}
