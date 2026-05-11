import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { wrapCrossRefs, type Vocab } from './cross-ref';

marked.setOptions({ gfm: true, breaks: false });

export function renderMarkdown(src: string, vocab?: Vocab): string {
  const raw = marked.parse(src) as string;
  const safe = DOMPurify.sanitize(raw, { ADD_ATTR: ['target'] });
  return vocab ? wrapCrossRefs(safe, vocab) : safe;
}
