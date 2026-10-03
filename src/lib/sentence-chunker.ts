// Splits a streaming LLM response into speakable chunks so TTS can start
// before the full reply has arrived.

const SENTENCE_END = /[.!?…。！？](["')\]]*)(\s+|$)/;
const CLAUSE_END = /[,;:—](\s+)/;

export function cleanForSpeech(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[*_#`>]+/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export class SentenceChunker {
  private buf = "";
  constructor(
    private opts: { minChars?: number; maxChars?: number } = {},
  ) {}

  /** Add streamed text; returns any chunks that are ready to speak. */
  push(delta: string): string[] {
    this.buf += delta;
    const out: string[] = [];
    const min = this.opts.minChars ?? 12;
    const max = this.opts.maxChars ?? 140;
    for (;;) {
      let cut = -1;
      let searchFrom = 0;
      while (searchFrom < this.buf.length) {
        const m = SENTENCE_END.exec(this.buf.slice(searchFrom));
        if (!m) break;
        const end = searchFrom + m.index + m[0].length;
        // Only a real boundary if followed by whitespace (or more text arrived).
        if (m[2] === "" ) break;
        if (end >= min) {
          cut = end;
          break;
        }
        searchFrom = end;
      }
      if (cut < 0 && this.buf.length > max) {
        const m = CLAUSE_END.exec(this.buf.slice(min));
        if (m) cut = min + m.index + m[0].length;
      }
      if (cut < 0) break;
      const chunk = cleanForSpeech(this.buf.slice(0, cut));
      this.buf = this.buf.slice(cut);
      if (chunk) out.push(chunk);
    }
    return out;
  }

  /** Flush whatever is left at the end of the stream. */
  flush(): string[] {
    const chunk = cleanForSpeech(this.buf);
    this.buf = "";
    return chunk ? [chunk] : [];
  }
}
