const {readFileSync} = require('fs');
const md = require('markdown-it')({
  // don't sanitize html if you want to support AMP components in Markdown
  html: true,
});
const AmpOptimizer = require('../../');

const ampOptimizer = AmpOptimizer.create({
  markdown: true,
});

async function compileMarkdownToAmp(filePath) {
  const markdown = readFileSync(filePath, 'utf-8');
  const html = md.render(markdown);
  const amphtml = await ampOptimizer.transformHtml(html, {
    canonical: filePath,
  });
  return amphtml;
}

compileMarkdownToAmp('./README.md').then(console.log);
