const localdate = (date, lang = 'en') => new Intl.DateTimeFormat(lang, {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
}).format(new Date(date || null))

module.exports = { localdate }
