export type TextRun = { text: string; bold?: boolean; underline?: boolean };

const HTML_TAG_PATTERN = /<[a-z][\s\S]*>/i;

/**
 * Converts legacy **bold** / __underline__ markers (from before the WYSIWYG
 * clause editor) into HTML. Content that's already HTML passes through
 * untouched — this only fires for old template clauses saved before the
 * editor switched to storing HTML directly.
 */
export function legacyMarkersToHtml(text: string): string {
  if (HTML_TAG_PATTERN.test(text)) return text;
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<u>$1</u>");
}

/** Strips a single outer <p>...</p> wrapper — clauses are stored as inline HTML, not a block. */
export function stripOuterParagraph(html: string): string {
  return html.replace(/^<p>([\s\S]*)<\/p>$/i, "$1").trim();
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Parses simple inline HTML (bold/underline only) into plain-text runs, for PDF rendering. */
export function htmlToRuns(html: string): TextRun[] {
  const body = html
    .replace(/<\/p>\s*<p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?p>/gi, "");

  const runs: TextRun[] = [];
  const pattern = /<(strong|b)>([\s\S]*?)<\/\1>|<u>([\s\S]*?)<\/u>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(body)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ text: decodeHtmlEntities(body.slice(lastIndex, match.index)) });
    }
    if (match[1]) {
      runs.push({ text: decodeHtmlEntities(match[2]), bold: true });
    } else if (match[3] !== undefined) {
      runs.push({ text: decodeHtmlEntities(match[3]), underline: true });
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < body.length) {
    runs.push({ text: decodeHtmlEntities(body.slice(lastIndex)) });
  }
  return runs.length ? runs : [{ text: decodeHtmlEntities(body) }];
}
