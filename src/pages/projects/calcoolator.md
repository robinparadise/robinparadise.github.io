---
title: My first minimal calcoolator
title.es: Mi primera calculadora minimalista
description: Just a simple calculator with a responsive design, provides basic and some advanced mathematical functions useful for anybody. Shows the mathematical expression and the partial result. You can operate the calculator directly from your keyboard, as well as using the buttons with your mouse. Enjoy!
description.es: Es solo una calculatora simple con un diseño responsive, ofrece operaciones básicas y algunas avanzadas. Muestra la expresión matemática y el resultado parcial. Puedes operar directamente desde el teclado o desde los mismos botones y sin "eval()" 👺.
tags: ['javascript', 'css']
link: https://robinparadise.github.io/simplecalcoolator
image: /assets/blog/19may22-simplecalcoolator.jpg
date: "2013-03-23"
---

# {{title}}

<section>
  <a href="{{langPath}}/about.html" rel="author">Robin</a> · <time datetime="{{date}}">{{ data.date | date(lang) }}</time>
  {% include "components/tags.html" %}
</section>

![Demo]({{image}})

{{description}}


[Demo]({{link}})
