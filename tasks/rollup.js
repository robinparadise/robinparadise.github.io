const util = require('util');
const exec = util.promisify(require('child_process').exec);

const rollupBuild = () => exec('rollup -c')
const rollup = () => exec('rollup -c rollup.dev.js')

module.exports = {
  rollup, rollupBuild
}