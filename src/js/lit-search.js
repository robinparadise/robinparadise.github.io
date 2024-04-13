import { html, render } from 'lit-html'
import styles from './lit-search.css'

const styleSet = new WeakSet();

const tag = (tag) => html`<span class="tag tag-{{ tag }} tag-sm">${tag}</span>`
const searchItems = () => fetch(`/assets/search.json`).then(res => res.json())

const LitSearchResults = (item, lang) => html`
  <li tabIndex="0">
    <a href="${lang}${item.url}">
      <h2>
        ${item.title}
      </h2>
      <div class="tags">
        ${(item.tags || []).map(tag)}
      </div>
    </a>
  </li>
`

export class LitSearch extends HTMLElement {

  constructor(items = [], term = '') {
    super()
    this._stylize()
    this.items = items
    this.term = term
  }

  _stylize() {
    const root = this.getRootNode()
    const styled = document.getElementById('lit-search')
    if (!styleSet.has(root) || !styled) {
      styleSet.add(root)
      const style = document.createElement('style')
      style.id = 'lit-search'
      style.textContent = styles;
      document.body.appendChild(style)
    }
  }

  createRenderRoot() {
    return this;
  }

  focus() {
    const input = this.querySelector('.search-input')
    if (input) {
      input.focus()
    }
  }

  async connectedCallback() {
    this.items = await searchItems()
    this.lang = document.body.attributes['language'].value || ''
    render(this.template, this)
    this.focus()
    this.firstElementChild.showModal()
  }


  async handleChange(ev) {
    const term = (ev.target.value || '').toLowerCase().trim()
    if (term)
      this.filtered = this.items.filter(i =>
        (i.title || '').toLowerCase().includes(term) ||
        (i.description || '').toLowerCase().includes(term) ||
        (i.tags || []).join(',').toLowerCase().includes(term)
      )
    else this.filtered = null
    render(this.template, this)
  }

  close(ev = null) {
    if (ev) {
      if (ev.target.tagName === 'DIALOG')
        this.close()
    } else {
      this.firstElementChild.close()
    }
  }

  moveDown() {
    const activeElement = document.activeElement
    if (activeElement) {
      if (activeElement.tagName === 'LI') {
        return activeElement.nextElementSibling?.focus()
      }
      if (activeElement.tagName === 'INPUT') {
        this.querySelector('ul li')?.focus()
      }
    }
  }

  moveUp() {
    const activeElement = document.activeElement
    if (activeElement) {
      if (activeElement.tagName === 'LI') {
        return activeElement.previousElementSibling?.focus()
      }
      this.focus()
    }
  }

  select() {
    const activeElement = document.activeElement
    if (activeElement) {
      activeElement.querySelector('a').click()
      this.close()
    }
  }

  keydown(ev) {
    if (ev.which === 40) {
      this.moveDown()
    } else if (ev.which === 38) {
      this.moveUp()
    } else if (ev.which === 13) {
      this.select()
    }
  }

  get template() {
    return html`
      <dialog @click=${this.close} @keydown=${e => this.keydown(e)}>
        <div class="input-cont">
          <input
            class="search-input"
            type="search"
            autofocus
            tabindex="0"
            autocomplete="off"
            placeholder="Search..."
            value=${this.term} @input=${e => this.handleChange(e)}/>
            <ul class="result-list">
              ${(this.filtered || this.items).map(item => LitSearchResults(item, this.lang))}
            </ul>
        </SearchResults>
      </dialog>
    `;
  }
}

customElements.define('lit-search', LitSearch);
