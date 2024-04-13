// This template could also be stored in HTML as a `<template>`
const TEMPLATE = `
<div class="message">
  <img class="profile-photo">
  <div class="author"></div>
  <div class="message-text"></div>
  <time></time>
</div>
`;

// The class extends `HTMLElement`, but actually it could extend any element, such as `HTMLImageElement`
class CustomMessage extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = TEMPLATE;
  }
  
  // Whenever an attibute is changed, this function is called. A switch statement is a good way to handle the various attributes.
  // Note that this also gets called the first time the attribute is set, so we do not need any special initialisation code.
  attributeChangedCallback(name, oldValue, newValue) {
    switch(name) {
      case 'author':
        this.querySelector('.author').innerText = newValue;
        this.querySelector('.message').classList.toggle('self', newValue === 'Me');
        break;
      case 'profile-photo':
        this.querySelector('.profile-photo').setAttribute('src', newValue);
        break;
      case 'message-text':
        this.querySelector('.message-text').innerText = newValue;
        break;
      case 'time':
        this.querySelector('time').innerText = newValue;
        break;
    }
  }
  
  // We need to specify which attributes will be watched for changes. If an attribute is not included here, attributeChangedCallback will never be called for it
  static get observedAttributes() {
    return ['author', 'profile-photo', 'message-text', 'time'];
  }
}

// Now that our class is defined, we can register it
customElements.define('custom-message', CustomMessage);