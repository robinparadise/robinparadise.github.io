import { html, render } from 'lit-html'
import { comments } from './services/_mock'

const styleSet = new WeakSet();

const styles = `
  :host {
    font-size: 1.2em;
  }
  /* ----- Section Coments ----- */

  .comments__list-comment {
    list-style: none;
    padding: 0;
  }

  .section-comments {
    padding: 0 0px 50px;
  }

  /* ----- Comment ----- */

  .list-comment__comment {
    width: 100%;
    margin-bottom: 50px;
  }
  .list-comment__comment:after {
    display: table;
    content: "";
  }

  .list-comment__comment:before {
    display: table;
    content: "";
  }
  .list-comment__comment:after {
    clear: both;
  }
  .comment__avatar{
    width: 70px;
    height: 100%;
    margin-inline: auto;
    text-align: center;
    display: inline-flex;
    justify-content: center;
  }
  .avatar__border{
    width: 50px;
    height: 50px;
    border-radius: 35px;
    overflow: hidden;
  }
  .avatar__author{
    width: 50px;
  }
  .comment__comment-text{
    width: calc(100% - 80px);
    display: inline-block;
    vertical-align: top;
  }
  .comment-text__name-author{
    margin: 0;
    padding: 0;
    font-weight: 700;
    font-variation-settings: "wght" 700;
  }
  .name-author__data-post:before {
    content: " · ";
    font-weight: 900;
    font-variation-settings: "wght" 900;
  }
  .name-author__data-post{
    font-weight: 400;
    font-variation-settings: "wght" 400;
    font-size: 14px;
    color: gray;
  }
  .comment-text__content{
    font-size: 17px;
    line-height: 18pt;
  }
  @media (max-width: 767px) {
    .comment__avatar {
      float:left;
      shape-outside: ellipse();
    }
    .comment__comment-text {
      width: 100%;
      display: block;
    }
  }
`;

const renderComment = (comment) => html`
  <li class="list-comment__comment">
    <div class="comment__avatar">
      <div class="avatar__border">
        <img class="avatar__author" src="${comment.user.photo}" alt=""/>
      </div>
    </div>
    <div class="comment__comment-text">
      <h5 class="comment-text__name-author">${comment.user.name}<span class="name-author__data-post">2 hours ago</span></h5>
      <span class="comment-text__content markdown-body" .innerHTML="${comment.text}"></span>
    </div>
  </li>
`

export class LitComments extends HTMLElement {
  static properties = {
    items: {type: Array}
  };
  constructor() {
    super();
    this.items = []
    this.items = comments();
    this._stylize();
  }
  
  connectedCallback() {
    render(this.render(), this)
  }

  _stylize() {
    const root = this.getRootNode()
    const styled = document.getElementById('lit-comments')
    if (!styleSet.has(root) || !styled) {
      styleSet.add(root)
      const style = document.createElement('style')
      style.id = 'lit-comments'
      // Apply whatever scoping makes sense.
      style.textContent = styles;
      document.body.appendChild(style)
    }
  }

  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <h3>Comments</h3>
      <div class="section-comments">
        <div class="section-comments__comments">
          <ul class="comments__list-comment">
            ${this.items.map(comment => renderComment(comment))}
          </ul>
        </div>
      </div>
    `;
  }
}

customElements.define('lit-comments', LitComments);
