/**
 * Built-in themes for md2html-self.
 * Each theme provides CSS variables + mermaid theme config.
 */

export const themes = {
  dark: {
    name: 'dark',
    css: `:root{--bg:#0d1117;--surface:#161b22;--surface2:#1c2129;--border:#30363d;--text:#e6edf3;--text-muted:#8b949e;--accent:#58a6ff;--accent2:#3fb950;--accent3:#d2a8ff;--orange:#d29922}
body{background:var(--bg);color:var(--text)}
h1{background:linear-gradient(135deg,var(--accent),var(--accent3));background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent}
h2{border-bottom:2px solid var(--border);color:var(--accent)}
h3{color:var(--accent3)}
h4{color:var(--orange)}
a{color:var(--accent)}
blockquote{border-left:4px solid var(--accent);background:var(--surface);color:var(--text-muted)}
blockquote strong{color:var(--text)}
code{background:var(--surface2);border:1px solid var(--border)}
pre{background:var(--surface)!important;border:1px solid var(--border)}
pre code{background:none;border:none}
thead{background:var(--surface)}
th{border:1px solid var(--border);color:var(--accent)}
td{border:1px solid var(--border)}
tr:nth-child(even){background:var(--surface)}
tr:hover{background:var(--surface2)}
.mermaid-rendered{background:var(--surface);border:1px solid var(--border)}
#toc{background:var(--surface);border-right:1px solid var(--border)}
#toc a{color:var(--text-muted)}
#toc a:hover{background:var(--surface2);color:var(--text)}
#toc a.l2{color:var(--text)}
#toc-title{color:var(--accent);border-bottom:1px solid var(--border)}
#toggle-toc{background:var(--surface);border:1px solid var(--border);color:var(--text)}
#toggle-toc:hover{background:var(--accent);color:var(--bg)}
#scroll-top{background:var(--accent);color:var(--bg)}
@media print{#toc,#toggle-toc,#scroll-top{display:none}#content{max-width:100%}body{background:#fff;color:#000}h1,h2,h3{-webkit-text-fill-color:initial;color:#000}table,th,td{border-color:#ccc}pre,code,blockquote,.mermaid-rendered{background:#f5f5f5!important;border-color:#ddd!important}}`,
    mermaid: {
      theme: 'dark',
      themeVariables: {
        primaryColor: '#1f6feb', primaryTextColor: '#e6edf3', primaryBorderColor: '#58a6ff',
        lineColor: '#8b949e', secondaryColor: '#161b22', tertiaryColor: '#1c2129',
        background: '#161b22', mainBkg: '#1f6feb', nodeBorder: '#58a6ff',
        clusterBkg: '#161b22', clusterBorder: '#30363d', titleColor: '#e6edf3',
        edgeLabelBackground: '#161b22', nodeTextColor: '#e6edf3'
      }
    }
  },

  light: {
    name: 'light',
    css: `:root{--bg:#ffffff;--surface:#f6f8fa;--surface2:#eaeef2;--border:#d0d7de;--text:#1f2328;--text-muted:#656d76;--accent:#0969da;--accent2:#1a7f37;--accent3:#8250df;--orange:#bf8700}
body{background:var(--bg);color:var(--text)}
h1{background:linear-gradient(135deg,var(--accent),var(--accent3));background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent}
h2{border-bottom:2px solid var(--border);color:var(--accent)}
h3{color:var(--accent3)}
h4{color:var(--orange)}
a{color:var(--accent)}
blockquote{border-left:4px solid var(--accent);background:var(--surface);color:var(--text-muted)}
blockquote strong{color:var(--text)}
code{background:var(--surface2);border:1px solid var(--border)}
pre{background:var(--surface)!important;border:1px solid var(--border)}
pre code{background:none;border:none}
thead{background:var(--surface)}
th{border:1px solid var(--border);color:var(--accent)}
td{border:1px solid var(--border)}
tr:nth-child(even){background:var(--surface)}
tr:hover{background:var(--surface2)}
.mermaid-rendered{background:var(--surface);border:1px solid var(--border)}
#toc{background:var(--surface);border-right:1px solid var(--border)}
#toc a{color:var(--text-muted)}
#toc a:hover{background:var(--surface2);color:var(--text)}
#toc a.l2{color:var(--text)}
#toc-title{color:var(--accent);border-bottom:1px solid var(--border)}
#toggle-toc{background:var(--surface);border:1px solid var(--border);color:var(--text)}
#toggle-toc:hover{background:var(--accent);color:#fff}
#scroll-top{background:var(--accent);color:#fff}
@media print{#toc,#toggle-toc,#scroll-top{display:none}#content{max-width:100%}}`,
    mermaid: {
      theme: 'default',
      themeVariables: {
        primaryColor: '#dbeafe', primaryTextColor: '#1f2328', primaryBorderColor: '#0969da',
        lineColor: '#656d76', secondaryColor: '#f6f8fa', tertiaryColor: '#eaeef2',
        background: '#ffffff', mainBkg: '#dbeafe', nodeBorder: '#0969da',
        clusterBkg: '#f6f8fa', clusterBorder: '#d0d7de', titleColor: '#1f2328',
        edgeLabelBackground: '#ffffff', nodeTextColor: '#1f2328'
      }
    }
  }
};

export function getTheme(name) {
  const theme = themes[name];
  if (!theme) {
    const available = Object.keys(themes).join(', ');
    throw new Error(`Unknown theme "${name}". Available themes: ${available}`);
  }
  return theme;
}
