const data = {
  style: 'style.css',
  favicon: '/assets/favicon.ico',
  image: '',
  description: 'Fullstack JavaScript Developer. Passionate about the Linux operating system, free software and web programming.',
  year: new Date().getFullYear(),
  age: parseInt((new Date() - new Date(1990, 4, 23)) / (1000 * 60 * 60 * 24 * 365))
}
module.exports = { data }