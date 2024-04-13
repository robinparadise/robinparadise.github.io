const { spawn, exec } = require('child_process');

const reload = () => {
  spawn('gulp')
}

const kill = () => {
  exec('kill $(lsof -t -i:8080)')
}

module.exports = { reload, kill }