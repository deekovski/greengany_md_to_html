import { readFileSync, writeFileSync } from 'fs';
import { marked } from 'marked';
import puppeteer from 'puppeteer';

const md = readFileSync('ARCHITECTURE.md', 'utf-8');

// ── Slug generator ──
function slugify(text) {
  return text.toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Collect mermaid blocks during markdown parse ──
const mermaidDefs = [];  // raw mermaid source strings
const renderer = new marked.Renderer();

renderer.heading = function (text, level) {
  let content = text, lvl = level;
  if (typeof text === 'object' && text !== null) { lvl = text.depth; content = text.text || text.raw || ''; }
  const slug = slugify(content);
  return `<h${lvl} id="${slug}">${content}</h${lvl}>\n`;
};

renderer.code = function (src, lang) {
  let code = src, language = lang;
  if (typeof src === 'object' && src !== null) { language = src.lang; code = src.text || src.raw || ''; }
  code = code || ''; language = language || '';
  if (language === 'mermaid') {
    const idx = mermaidDefs.length;
    mermaidDefs.push(code);
    return `<!--MERMAID_${idx}-->`;
  }
  return `<pre><code class="language-${language}">${escapeHtml(code)}</code></pre>`;
};

marked.setOptions({ renderer, gfm: true, breaks: false });
let htmlBody = marked.parse(md);

// ── Pre-render mermaid diagrams to SVG using Puppeteer ──
console.log(`📊 Pre-rendering ${mermaidDefs.length} Mermaid diagrams...`);

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

// Load a minimal page with mermaid
await page.setContent(`<!DOCTYPE html><html><head>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
</head><body><div id="container"></div></body></html>`, { waitUntil: 'networkidle0' });

// Initialize mermaid on the page
await page.evaluate(() => {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
      primaryColor: '#1f6feb', primaryTextColor: '#e6edf3', primaryBorderColor: '#58a6ff',
      lineColor: '#8b949e', secondaryColor: '#161b22', tertiaryColor: '#1c2129',
      background: '#161b22', mainBkg: '#1f6feb', nodeBorder: '#58a6ff',
      clusterBkg: '#161b22', clusterBorder: '#30363d', titleColor: '#e6edf3',
      edgeLabelBackground: '#161b22', nodeTextColor: '#e6edf3'
    },
    securityLevel: 'loose',
    flowchart: { htmlLabels: true, curve: 'basis' },
    sequence: { actorMargin: 80 }
  });
});

// Render each diagram
const svgs = [];
for (let i = 0; i < mermaidDefs.length; i++) {
  const svg = await page.evaluate(async (def, id) => {
    try {
      const { svg } = await mermaid.render('mermaid-' + id, def);
      return svg;
    } catch (e) {
      return `<pre style="color:#f85149;padding:12px;">[Mermaid error: ${e.message}]</pre>`;
    }
  }, mermaidDefs[i], i);
  svgs.push(svg);
  process.stdout.write(`  ✓ Diagram ${i + 1}/${mermaidDefs.length}\n`);
}

await browser.close();

// Replace placeholders with rendered SVGs
for (let i = 0; i < svgs.length; i++) {
  htmlBody = htmlBody.replace(
    `<!--MERMAID_${i}-->`,
    `<div class="mermaid-rendered">${svgs[i]}</div>`
  );
}

// ── Build final self-contained HTML ──
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Greengany Platform — Architecture Document</title>
<style>
:root{--bg:#0d1117;--surface:#161b22;--surface2:#1c2129;--border:#30363d;--text:#e6edf3;--text-muted:#8b949e;--accent:#58a6ff;--accent2:#3fb950;--accent3:#d2a8ff;--orange:#d29922}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:var(--bg);color:var(--text);line-height:1.7;font-size:16px}
#content{max-width:1100px;margin:0 auto;padding:40px 32px 80px}
h1{font-size:2.4em;margin:0 0 8px;background:linear-gradient(135deg,var(--accent),var(--accent3));background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-0.5px}
h2{font-size:1.8em;margin:56px 0 20px;padding-bottom:12px;border-bottom:2px solid var(--border);color:var(--accent)}
h3{font-size:1.35em;margin:36px 0 14px;color:var(--accent3)}
h4{font-size:1.1em;margin:28px 0 10px;color:var(--orange)}
p{margin:0 0 16px}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
blockquote{border-left:4px solid var(--accent);padding:12px 20px;margin:16px 0;background:var(--surface);border-radius:0 8px 8px 0;color:var(--text-muted)}
blockquote strong{color:var(--text)}
ul,ol{margin:0 0 16px;padding-left:28px}
li{margin:4px 0}
hr{border:none;border-top:2px solid var(--border);margin:40px 0}
code{font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:0.88em;background:var(--surface2);padding:2px 7px;border-radius:5px;border:1px solid var(--border)}
pre{margin:16px 0;border-radius:10px;overflow-x:auto;background:var(--surface)!important;border:1px solid var(--border);padding:20px!important}
pre code{background:none;border:none;padding:0;font-size:0.85em;line-height:1.6}
table{width:100%;border-collapse:collapse;margin:16px 0;font-size:0.92em}
thead{background:var(--surface)}
th{padding:12px 16px;text-align:left;border:1px solid var(--border);color:var(--accent);font-weight:600;white-space:nowrap}
td{padding:10px 16px;border:1px solid var(--border);vertical-align:top}
tr:nth-child(even){background:var(--surface)}
tr:hover{background:var(--surface2)}
.mermaid-rendered{background:var(--surface);border-radius:10px;padding:24px;margin:16px 0;border:1px solid var(--border);text-align:center;overflow-x:auto}
.mermaid-rendered svg{max-width:100%;height:auto}
#toc{position:fixed;top:0;left:0;width:280px;height:100vh;background:var(--surface);border-right:1px solid var(--border);overflow-y:auto;padding:20px 16px;z-index:100;transform:translateX(-100%);transition:transform .3s ease}
#toc.open{transform:translateX(0)}
#toc a{display:block;padding:5px 8px;font-size:0.82em;color:var(--text-muted);border-radius:4px;line-height:1.4;margin:1px 0}
#toc a:hover{background:var(--surface2);color:var(--text);text-decoration:none}
#toc a.l2{font-weight:600;color:var(--text);margin-top:8px}
#toc a.l3{padding-left:20px;font-size:0.78em}
#toc-title{font-size:1.1em;font-weight:700;color:var(--accent);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border)}
#toggle-toc{position:fixed;top:16px;left:16px;z-index:200;background:var(--surface);border:1px solid var(--border);color:var(--text);padding:8px 14px;border-radius:8px;cursor:pointer;font-size:1.1em;transition:all .2s}
#toggle-toc:hover{background:var(--accent);color:var(--bg)}
#scroll-top{position:fixed;bottom:24px;right:24px;background:var(--accent);color:var(--bg);border:none;width:44px;height:44px;border-radius:50%;cursor:pointer;font-size:1.3em;opacity:0;transition:opacity .3s;z-index:100}
#scroll-top.visible{opacity:1}
@media print{#toc,#toggle-toc,#scroll-top{display:none}#content{max-width:100%}body{background:#fff;color:#000}h1,h2,h3{-webkit-text-fill-color:initial;color:#000}table,th,td{border-color:#ccc}pre,code,blockquote,.mermaid-rendered{background:#f5f5f5!important;border-color:#ddd!important}}
@media(max-width:768px){#content{padding:20px 16px}h1{font-size:1.6em}h2{font-size:1.3em}table{font-size:0.8em}th,td{padding:6px 8px}}
</style>
</head>
<body>
<button id="toggle-toc" title="Table of Contents">&#9776;</button>
<nav id="toc"><div id="toc-title">&#128209; Contents</div><div id="toc-links"></div></nav>
<button id="scroll-top" title="Back to top">&uarr;</button>
<div id="content">
${htmlBody}
</div>
<script>
// Build sidebar TOC from headings
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
</script>
</body>
</html>`;

writeFileSync('ARCHITECTURE.html', html, 'utf-8');
console.log(`\n✅ Self-contained ARCHITECTURE.html generated (${Math.round(html.length / 1024)} KB)`);
console.log('   → 0 external dependencies, all diagrams pre-rendered as inline SVG');
