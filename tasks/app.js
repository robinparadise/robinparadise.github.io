const fs = require('fs')
const path = require('path')
const { html, tags } = require('./html')
const { langs, data } = require('../context')

const WARN = '\x1b[33m%s\x1b[0m'

const currentPath = `src/pages`
const state = {
  version: 0
}

let timer = 0
const setVersion = (val) => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    state.version = val
  }, 100)
}

const appendLivereload = (file) => {
  return file.replace('</body>', `
    <script>
      const evs = new EventSource('http://localhost:8080/livereload', {})
      evs.onmessage = () => location.reload()
    </script>
  </body>
  `)
}

let clients = []
const eventSource = (req, res) => {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  res.writeHead(200, headers)

  const clientId = Date.now()
  const newClient = {
    id: clientId,
    res
  };

  clients.push(newClient)

  req.on('close', (ev) => {
    clients = clients.filter(client => client.id !== clientId);
  })
}

const serveAssets = (req, res) => {
  let filePath = req.url.includes('.') ? '.' + req.url : `.${req.url}.js`
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.min':
      filePath += '.js'
      contentType = 'text/javascript';
      break;
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;      
    case '.jpg':
      contentType = 'image/jpg';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
    case '.woff2':
      contentType = 'font/woff2';
      break;
  }

  fs.readFile(filePath.replace('./', './www/'), function(error, content) {
    if (error) {
      console.error(error)
      if(error.code == 'ENOENT'){
        fs.readFile('./www/404.html', function(error, content) {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        });
      }
      else {
        res.writeHead(500);
        res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
        res.end(); 
      }
    }
    else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}

const handler = (req, res) => {

  if (req.url.includes('/tags/')) {
    const originalPath = req.url.endsWith('/') ? req.url.replace(/\/$/, '.html') : req.url
    const languages = langs().filter(Boolean)
    const path = originalPath.split('/').filter(i => !languages.includes(i)).join('/')

    return tags(path)
    .then(() => {
      fs.readFile(`www${originalPath}`, 'utf8', (err, file) => {
        if (err) console.error(err);
        res.setHeader('Content-Type', 'text/html')
        res.setHeader('Cache-Control', 'no-store,max-age=0')

        const content = appendLivereload(file || '')
        res.write(content)
        res.end()
      })
    })
  } else if (req.url.includes('.html') || req.url === '/' || req.url.endsWith('/')) {
    const originalPath = req.url.endsWith('/') ? req.url +'index.html' : req.url
    const languages = langs().filter(Boolean)
    const path = originalPath.split('/').filter(i => !languages.includes(i)).join('/')

    const isMD = path.includes('/tags/') ? false : data.collections.find(dir => path.includes(`/${dir}/`))
    let buildPath = isMD ? `${currentPath}${path.replace(/\.html$/, '.md')}` : `${currentPath}${path}`

    return html(buildPath)
    .then(() => {
      fs.readFile(`www${originalPath}`, 'utf8', (err, file) => {
        if (err) console.error(err);
        res.setHeader('Content-Type', 'text/html')
        res.setHeader('Cache-Control', 'no-store,max-age=0')

        const content = appendLivereload(file || '')
        res.write(content)
        res.end()
      })
    })
  } else if (req.url === '/livereload') {
    return eventSource(req, res)
  }
  return serveAssets(req, res)
}

const onKeypress = () => {
  const keypress = require('keypress')
  keypress(process.stdin)
  if (process.stdin.isTTY && !process.stdin.isRaw) {
    process.stdin.setRawMode(true)
  }

  process.stdin.on('keypress', function(ch, key) {
    if ( key && key.ctrl )  {
      if ( key.name == 'c') {
        console.log(WARN, 'quitting...' + process.pid)
        try { serverHTTP.close() } catch(_) {}
        const { kill } = require('./reload')
        kill()
        process.exit(0)
      } else {
        console.log(WARN, 'suspending...');
      }
    } else {
      console.log()
    }
  })
}


const server = () => {
  const http = require('node:http');
  serverHTTP = http.createServer(handler)
  console.log(WARN, 'Listening on http://localhost:8080')
  serverHTTP.listen(8080)
  onKeypress()
}

enable = false
const reload = (arg) => {
  if (!enable && arg) {
    setTimeout(() => {
      enable = true
    }, 1500)
    return null
  }
  console.log(WARN, '[reload]')
  clients.forEach(client => client.res.write(`data: update\n\n`))
}


module.exports = { server, reload }
