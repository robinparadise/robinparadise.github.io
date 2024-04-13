import { nodeResolve } from '@rollup/plugin-node-resolve'
import css from 'rollup-plugin-import-css'

export default {
  input: "src/js/index.js",
  output: {
    dir: "www/assets",
    format: "es",
    compact: false,
    chunkFileNames: "[name].js",
    name: 'lit-index.js',
  },
  plugins: [
    css(),
    nodeResolve()
  ]
}
