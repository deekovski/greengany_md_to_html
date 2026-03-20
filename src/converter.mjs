/**
 * md2html-self — Core converter module
 *
 * Converts a Markdown string into a beautiful, self-contained HTML document.
 * Supports Mermaid diagrams (pre-rendered to SVG via Puppeteer), code blocks,
 * tables, GFM, sidebar TOC, and dark/light themes.
 */

import { marked } from 'marked';
import puppeteer from 'puppeteer';
import { getTheme } from './themes.mjs';

// ── Helpers ────────────────────────────────────────────────────────

function slugify(text) {
  return text.toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Mermaid pre-rendering ──────────────────────────────────────────

async function renderMermaidDiagrams(defs, mermaidConfig, log) {
  if (defs.length === 0) return [];

  log(`📊 Pre-rendering ${defs.length} Mermaid diagram${defs.length > 1 ? 's' : ''}...`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(`<!DOCTYPE html><html><head>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
</head><body><div id="container"></div></body></html>`, { waitUntil: 'networkidle0' });

  await page.evaluate((cfg) => {
    mermaid.initialize({
      startOnLoad: false,
      ...cfg,
      securityLevel: 'loose',
      flowchart: { htmlLabels: true, curve: 'basis' },
      sequence: { actorMargin: 80 }
    });
  }, mermaidConfig);

  const svgs = [];
  for (let i = 0; i < defs.length; i++) {
    const svg = await page.evaluate(async (def, id) => {
      try {
        const { svg } = await mermaid.render('mermaid-' + id, def);
        return svg;
      } catch (e) {
        return `<pre style="color:#f85149;padding:12px;">[Mermaid error: ${e.message}]</pre>`;
      }
    }, defs[i], i);
    svgs.push(svg);
    log(`  ✓ Diagram ${i + 1}/${defs.length}`);
  }

  await browser.close();
  return svgs;
}

// ── Base CSS (layout / structure — theme-independent) ──────────────

const BASE_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;line-height:1.7;font-size:16px}
#content{max-width:1100px;margin:0 auto;padding:40px 32px 80px}
h1{font-size:2.4em;margin:0 0 8px;letter-spacing:-0.5px}
h2{font-size:1.8em;margin:56px 0 20px;padding-bottom:12px}
h3{font-size:1.35em;margin:36px 0 14px}
h4{font-size:1.1em;margin:28px 0 10px}
p{margin:0 0 16px}
a{text-decoration:none}
a:hover{text-decoration:underline}
blockquote{padding:12px 20px;margin:16px 0;border-radius:0 8px 8px 0}
ul,ol{margin:0 0 16px;padding-left:28px}
li{margin:4px 0}
hr{border:none;border-top:2px solid var(--border);margin:40px 0}
code{font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:0.88em;padding:2px 7px;border-radius:5px}
pre{margin:16px 0;border-radius:10px;overflow-x:auto;padding:20px!important}
pre code{padding:0;font-size:0.85em;line-height:1.6}
table{width:100%;border-collapse:collapse;margin:16px 0;font-size:0.92em}
th{padding:12px 16px;text-align:left;font-weight:600;white-space:nowrap}
td{padding:10px 16px;vertical-align:top}
.mermaid-rendered{border-radius:10px;padding:24px;margin:16px 0;text-align:center;overflow-x:auto}
.mermaid-rendered svg{max-width:100%;height:auto}
#toc{position:fixed;top:0;left:0;width:280px;height:100vh;overflow-y:auto;padding:20px 16px;z-index:100;transform:translateX(-100%);transition:transform .3s ease}
#toc.open{transform:translateX(0)}
#toc a{display:block;padding:5px 8px;font-size:0.82em;border-radius:4px;line-height:1.4;margin:1px 0;text-decoration:none}
#toc a.l2{font-weight:600;margin-top:8px}
#toc a.l3{padding-left:20px;font-size:0.78em}
#toc-title{font-size:1.1em;font-weight:700;margin-bottom:12px;padding-bottom:8px}
#toggle-toc{position:fixed;top:16px;left:16px;z-index:200;padding:8px 14px;border-radius:8px;cursor:pointer;font-size:1.1em;transition:all .2s}
#scroll-top{position:fixed;bottom:24px;right:24px;border:none;width:44px;height:44px;border-radius:50%;cursor:pointer;font-size:1.3em;opacity:0;transition:opacity .3s;z-index:100}
#scroll-top.visible{opacity:1}
@media(max-width:768px){#content{padding:20px 16px}h1{font-size:1.6em}h2{font-size:1.3em}table{font-size:0.8em}th,td{padding:6px 8px}}
`;

// ── Interactive JS for the generated HTML ──────────────────────────

const INTERACTIVE_JS = `
const headings=document.querySelectorAll('#content h2, #content h3');
const tocEl=document.getElementById('toc-links');
let tocHtml='';
headings.forEach((h)=>{const id=h.id||'';if(!id)return;tocHtml+='<a href="#'+id+'" class="'+(h.tagName==='H2'?'l2':'l3')+'">'+h.textContent+'</a>';});
tocEl.innerHTML=tocHtml;
tocEl.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>document.getElementById('toc').classList.remove('open')));
document.getElementById('toggle-toc').addEventListener('click',()=>document.getElementById('toc').classList.toggle('open'));
document.addEventListener('click',e=>{const t=document.getElementById('toc');if(t.classList.contains('open')&&!t.contains(e.target)&&e.target.id!=='toggle-toc')t.classList.remove('open')});
window.addEventListener('scroll',()=>document.getElementById('scroll-top').classList.toggle('visible',window.scrollY>400));
document.getElementById('scroll-top').addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
`;

// ── Main conversion function ───────────────────────────────────────

/**
 * Convert Markdown to a self-contained HTML string.
 *
 * @param {string} markdown  Raw markdown content
 * @param {object} [options]
 * @param {string} [options.title]         HTML <title>
 * @param {string} [options.theme='dark']  Theme name ('dark' | 'light')
 * @param {boolean} [options.toc=true]     Include sidebar table-of-contents
 * @param {function} [options.log]         Logging function (defaults to console.log)
 * @returns {Promise<string>} Complete self-contained HTML document
 */
export async function convert(markdown, options = {}) {
  const {
    title = 'Document',
    theme: themeName = 'dark',
    toc = true,
    log = console.log,
  } = options;

  const theme = getTheme(themeName);

  // ── Parse markdown, collecting mermaid blocks ──
  const mermaidDefs = [];
  const renderer = new marked.Renderer();

  renderer.heading = function (text, level) {
    let content = text, lvl = level;
    if (typeof text === 'object' && text !== null) {
      lvl = text.depth;
      content = text.text || text.raw || '';
    }
    const slug = slugify(content);
    return `<h${lvl} id="${slug}">${content}</h${lvl}>\n`;
  };

  renderer.code = function (src, lang) {
    let code = src, language = lang;
    if (typeof src === 'object' && src !== null) {
      language = src.lang;
      code = src.text || src.raw || '';
    }
    code = code || '';
    language = language || '';
    if (language === 'mermaid') {
      const idx = mermaidDefs.length;
      mermaidDefs.push(code);
      return `<!--MERMAID_${idx}-->`;
    }
    return `<pre><code class="language-${language}">${escapeHtml(code)}</code></pre>`;
  };

  marked.setOptions({ renderer, gfm: true, breaks: false });
  let htmlBody = marked.parse(markdown);

  // ── Render mermaid diagrams ──
  const svgs = await renderMermaidDiagrams(mermaidDefs, theme.mermaid, log);
  for (let i = 0; i < svgs.length; i++) {
    htmlBody = htmlBody.replace(
      `<!--MERMAID_${i}-->`,
      `<div class="mermaid-rendered">${svgs[i]}</div>`
    );
  }

  // ── Assemble final document ──
  const tocHtml = toc ? `
<button id="toggle-toc" title="Table of Contents">&#9776;</button>
<nav id="toc"><div id="toc-title">&#128209; Contents</div><div id="toc-links"></div></nav>
<button id="scroll-top" title="Back to top">&uarr;</button>` : '';

  const tocScript = toc ? `<script>${INTERACTIVE_JS}</script>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>${BASE_CSS}\n${theme.css}</style>
</head>
<body>
${tocHtml}
<div id="content">
${htmlBody}
</div>
${tocScript}
</body>
</html>`;
}
