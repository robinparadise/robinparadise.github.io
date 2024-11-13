const fs = require("fs");
const path = require("path");
const marked = require("marked");
const hljs = require("highlight.js");

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
  </head>
  <body class="markdown-body">
    ${content}
  </body>
  </html>
`;


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
