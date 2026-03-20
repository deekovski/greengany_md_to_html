#!/usr/bin/env node

/**
 * md2html — CLI entry point
 *
 * Usage:
 *   md2html <input.md> [options]
 *   npx md2html-self README.md --theme light --title "My Docs"
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, basename, extname } from 'path';
import { convert } from '../src/converter.mjs';

// ── Argument parsing (zero dependencies) ──────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2); // strip node + script
  const parsed = {
    input: null,
    output: null,
    title: null,
    theme: 'dark',
    toc: true,
    help: false,
    version: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') { parsed.help = true; continue; }
    if (arg === '--version' || arg === '-v') { parsed.version = true; continue; }
    if (arg === '--no-toc') { parsed.toc = false; continue; }

    if ((arg === '--output' || arg === '-o') && args[i + 1]) { parsed.output = args[++i]; continue; }
    if ((arg === '--title' || arg === '-t') && args[i + 1]) { parsed.title = args[++i]; continue; }
    if (arg === '--theme' && args[i + 1]) { parsed.theme = args[++i]; continue; }

    // Handle --key=value syntax
    if (arg.startsWith('--output=')) { parsed.output = arg.split('=').slice(1).join('='); continue; }
    if (arg.startsWith('--title=')) { parsed.title = arg.split('=').slice(1).join('='); continue; }
    if (arg.startsWith('--theme=')) { parsed.theme = arg.split('=').slice(1).join('='); continue; }

    // Positional → input file
    if (!arg.startsWith('-') && !parsed.input) { parsed.input = arg; continue; }

    console.error(`Unknown option: ${arg}`);
    process.exit(1);
  }

  return parsed;
}

// ── Help text ─────────────────────────────────────────────────────

const HELP = `
  \x1b[1m\x1b[36mmd2html-self\x1b[0m — Convert Markdown to beautiful, self-contained HTML

  \x1b[1mUSAGE\x1b[0m

    md2html <input.md> [options]
    npx md2html-self README.md

  \x1b[1mARGUMENTS\x1b[0m

    <input.md>            Markdown file to convert (required)

  \x1b[1mOPTIONS\x1b[0m

    -o, --output <file>   Output HTML file (default: <input>.html)
    -t, --title <title>   HTML document title (default: filename)
    --theme <name>        Color theme: dark, light (default: dark)
    --no-toc              Disable sidebar table of contents
    -h, --help            Show this help message
    -v, --version         Show version number

  \x1b[1mEXAMPLES\x1b[0m

    md2html README.md
    md2html docs/ARCHITECTURE.md -o build/arch.html --theme light
    md2html notes.md --title "Meeting Notes" --no-toc

  \x1b[1mFEATURES\x1b[0m

    ✦  Mermaid diagrams pre-rendered to inline SVG (no external JS)
    ✦  Syntax-highlighted code blocks
    ✦  GFM tables, blockquotes, task lists
    ✦  Sidebar table of contents with smooth scrolling
    ✦  Dark & light themes
    ✦  Fully self-contained — single HTML file, zero dependencies
    ✦  Print-friendly styles
`;

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    console.log(HELP);
    process.exit(0);
  }

  if (args.version) {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
    console.log(pkg.version);
    process.exit(0);
  }

  if (!args.input) {
    console.error('\x1b[31mError:\x1b[0m No input file specified.\n');
    console.log('  Usage: md2html <input.md> [options]');
    console.log('  Run  : md2html --help for full usage info.\n');
    process.exit(1);
  }

  const inputPath = resolve(args.input);
  const outputPath = args.output
    ? resolve(args.output)
    : inputPath.replace(/\.md$/i, '.html');

  const title = args.title || basename(inputPath, extname(inputPath));

  let markdown;
  try {
    markdown = readFileSync(inputPath, 'utf-8');
  } catch (err) {
    console.error(`\x1b[31mError:\x1b[0m Could not read file "${args.input}"`);
    console.error(`  ${err.message}`);
    process.exit(1);
  }

  console.log(`\n\x1b[36m◆ md2html-self\x1b[0m`);
  console.log(`  Input:  ${inputPath}`);
  console.log(`  Output: ${outputPath}`);
  console.log(`  Theme:  ${args.theme}`);
  console.log(`  TOC:    ${args.toc ? 'yes' : 'no'}\n`);

  const html = await convert(markdown, {
    title,
    theme: args.theme,
    toc: args.toc,
  });

  writeFileSync(outputPath, html, 'utf-8');

  const sizeKB = Math.round(html.length / 1024);
  console.log(`\n\x1b[32m✅ Done!\x1b[0m ${outputPath} (${sizeKB} KB)`);
  console.log('   → Self-contained, zero external dependencies\n');
}

main().catch((err) => {
  console.error(`\x1b[31mFatal error:\x1b[0m ${err.message}`);
  process.exit(1);
});
