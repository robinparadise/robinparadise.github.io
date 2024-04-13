import{x as t,$ as n}from"./lit-html-b7b362c1.js";const e=new WeakSet,i=t=>n`<span class="tag tag-{{ tag }} tag-sm">${t}</span>`;class s extends HTMLElement{constructor(t=[],n=""){super(),this._stylize(),this.items=t,this.term=n}_stylize(){const t=this.getRootNode(),n=document.getElementById("lit-search");if(!e.has(t)||!n){e.add(t);const n=document.createElement("style");n.id="lit-search",n.textContent=".input-cont {\n  width: 100%;\n  max-width: 600px;\n}\n\n.search-input {\n  width: 100%;\n  background-color: #EFEFEF;\n  border: none;\n  padding: 1em 1.5em;\n  box-sizing: border-box;\n  font-size: 25px;\n  outline-style: none;\n  z-index: 1;\n  position: sticky;\n  top: 0;\n}\n.search-input:focus {\n  border-bottom-right-radius: 0;\n  border-bottom-left-radius: 0;\n  background-color: white;\n  box-shadow: 0 0 25px rgba(0, 0, 0, 0.1);\n}\n.search-input:not(:focus) + .results {\n  display: none;\n}\n\n.results {\n  max-height: 12em;\n  overflow: auto;\n  border-bottom-right-radius: 8px;\n  border-bottom-left-radius: 8px;\n  box-shadow: 0 0 25px rgba(0, 0, 0, 0.1);\n  color: grey;\n}\n.results.result-none {\n  padding: 1em 1.5em;\n}\n\n.result-list {\n  background-color: white;\n  padding: 0;\n  margin: 0;\n}\n.result-list li {\n  padding: 0;\n  list-style: none;\n  display: flex;\n  justify-content: space-between;\n  cursor: pointer;\n}\n.result-list li a {\n  display: inline-block;\n  padding: 1em 1.5em;\n  width: 100%;\n}\n.result-list li div {\n  display: flex;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.result-list li h2 {\n  color: black;\n}\n.result-list li h2, .result-list li p {\n  margin: 0;\n  font-weight: normal;\n  font-size: 25px;\n  margin-right: 0.5em;\n}\n.result-list li:hover {\n  background-color: #EFFFFF;\n}\n.result-list li:focus-within {\n  background-color: #EFEFEF;\n}\n.result-list li:not(:last-child) {\n  border-bottom: 1px solid #EFEFEF;\n}\n.result-list li strong {\n  border-radius: 4px;\n  font-weight: normal;\n  background-color: yellow;\n}\ndialog {\n  width: min(600px, 90vw);\n  height: min(650px, 70vh);\n  margin: 10% auto auto;\n  border: none;\n  background: transparent;\n  padding: 0;\n  border-radius: 8px;\n}\ndialog::backdrop {\n  background: repeating-linear-gradient(\n    30deg,\n    rgba(24, 25, 23, 0.1),\n    rgba(24, 25, 23, 0.1) 1px,\n    rgba(24, 25, 23, 0.3) 1px,\n    rgba(24, 25, 23, 0.3) 20px\n  );\n  backdrop-filter: blur(1px)\n}",document.body.appendChild(n)}}createRenderRoot(){return this}focus(){const t=this.querySelector(".search-input");t&&t.focus()}async connectedCallback(){this.items=await fetch("/assets/search.json").then((t=>t.json())),this.lang=document.body.attributes.language.value||"",t(this.template,this),this.focus(),this.firstElementChild.showModal()}async handleChange(n){const e=(n.target.value||"").toLowerCase().trim();this.filtered=e?this.items.filter((t=>(t.title||"").toLowerCase().includes(e)||(t.description||"").toLowerCase().includes(e)||(t.tags||[]).join(",").toLowerCase().includes(e))):null,t(this.template,this)}close(t=null){t?"DIALOG"===t.target.tagName&&this.close():this.firstElementChild.close()}moveDown(){const t=document.activeElement;if(t){if("LI"===t.tagName)return t.nextElementSibling?.focus();"INPUT"===t.tagName&&this.querySelector("ul li")?.focus()}}moveUp(){const t=document.activeElement;if(t){if("LI"===t.tagName)return t.previousElementSibling?.focus();this.focus()}}select(){const t=document.activeElement;t&&(t.querySelector("a").click(),this.close())}keydown(t){40===t.which?this.moveDown():38===t.which?this.moveUp():13===t.which&&this.select()}get template(){return n`
      <dialog @click=${this.close} @keydown=${t=>this.keydown(t)}>
        <div class="input-cont">
          <input
            class="search-input"
            type="search"
            autofocus
            tabindex="0"
            autocomplete="off"
            placeholder="Search..."
            value=${this.term} @input=${t=>this.handleChange(t)}/>
            <ul class="result-list">
              ${(this.filtered||this.items).map((t=>((t,e)=>n`
  <li tabIndex="0">
    <a href="${e}${t.url}">
      <h2>
        ${t.title}
      </h2>
      <div class="tags">
        ${(t.tags||[]).map(i)}
      </div>
    </a>
  </li>
`)(t,this.lang)))}
            </ul>
        </SearchResults>
      </dialog>
    `}}customElements.define("lit-search",s);export{s as LitSearch};