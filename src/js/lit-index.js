const main = document.body.firstElementChild
const scrollTop = sessionStorage.getItem('scroll')
if (scrollTop !== null) {
  main.scrollTop = parseInt(scrollTop, 10);
}
const win = window
win.addEventListener('beforeunload', () => sessionStorage.setItem('scroll', `${main.scrollTop}`))

win['search'] = async () => {
  await import('./lit-search')
  const litSearch = document.querySelector('lit-search')
  if (litSearch && litSearch.firstElementChild) litSearch.firstElementChild.showModal()
  else {
    const litSearch = document.createElement('lit-search')
    document.body.appendChild(litSearch)
  }
}

document.querySelectorAll('a').forEach((link) => {
  link.addEventListener('mouseover', (e) => {
    const href = link.getAttribute('href');
    if (href.includes('https')) return null
    const prerenderLink = document.createElement('link');
    prerenderLink.setAttribute('rel', 'prerender');
    prerenderLink.setAttribute('href', href);

    document.head.appendChild(prerenderLink);
  }, {once : true});
});

export {}
