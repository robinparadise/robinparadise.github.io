const fs = require("fs");
const path = require("path");
// const marked = require("marked");
const { Marked } = require("marked");
const { markedHighlight } = require("marked-highlight");
const hljs = require('highlight.js');

// Array of directories containing Markdown files
const inputDirs = ["./00 - Intro", "./01 - Interfaces"];
const outputDir = "./md";

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const githubCss = fs.readFileSync("./github-markdown.css", "utf-8");
const htmlTemplate = (content) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown</title>
    <style>${githubCss}</style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.7.0/highlight.min.js"></script>

    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              primary: '#0D3B66',
              secondary: '#FAF0CA',
            },
            fontFamily: {
              sans: ['Roboto', 'sans-serif'],
            },
          },
        },
      }
    </script>
  </head>
  <body class="markdown-body">
    ${content}
    <script src="https://unpkg.com/@highlightjs/cdn-assets@11.7.0/languages/css.min.js"></script>
  </body>
  </html>
`;

const marked = new Marked(
  markedHighlight({
  emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
);


// Function to convert Markdown to HTML
async function convertMarkdownToHtml(inputPath, outputPath) {
  const markdown = fs.readFileSync(inputPath, "utf-8");
  const html = await marked.parse(markdown);
  fs.writeFileSync(outputPath, htmlTemplate(html));
  console.log(`Converted: ${inputPath} -> ${outputPath}`);
}

// Process each directory
inputDirs.forEach((dir) => {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((file) => {
      if (path.extname(file) === ".md") {
        const inputPath = path.join(dir, file);
        const outputPath = path.join(outputDir, `${path.basename(file, ".md")}.html`);
        convertMarkdownToHtml(inputPath, outputPath);
      }
    });
  } else {
    console.error(`Directory not found: ${dir}`);
  }
});
