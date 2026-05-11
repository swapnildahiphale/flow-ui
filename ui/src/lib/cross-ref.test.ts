import { describe, it, expect } from 'vitest';
import { wrapCrossRefs } from './cross-ref';

const vocab = { tasks: new Set(['callqa-deepgram','flow-ui']), projects: new Set(['callqa','flow-itself']), tags: new Set(['warp','flow']) };

describe('wrapCrossRefs', () => {
  it('wraps a known task slug', () => {
    const html = '<p>see callqa-deepgram for context</p>';
    expect(wrapCrossRefs(html, vocab)).toContain('<a class="xref task" href="/tasks/callqa-deepgram">callqa-deepgram</a>');
  });
  it('wraps #tag occurrences', () => {
    const html = '<p>tagged #warp</p>';
    expect(wrapCrossRefs(html, vocab)).toContain('<a class="xref tag" href="/tasks?tag=warp">#warp</a>');
  });
  it('does not wrap inside <code> blocks', () => {
    const html = '<p><code>callqa-deepgram</code> is literal</p>';
    expect(wrapCrossRefs(html, vocab)).toBe(html);
  });
});
