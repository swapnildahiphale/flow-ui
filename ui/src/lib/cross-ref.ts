export type Vocab = {
  tasks: Set<string>;
  projects: Set<string>;
  tags: Set<string>;
};

const CODE_RE = /<(code|pre)[\s>][\s\S]*?<\/\1>/g;
const LINK_RE = /<a[^>]*>[\s\S]*?<\/a>/g;

export function wrapCrossRefs(html: string, vocab: Vocab): string {
  // Mask code blocks so we don't mutate inside them.
  const codeMasks: string[] = [];
  let out = html.replace(CODE_RE, m => { codeMasks.push(m); return ` CODEMASK${codeMasks.length - 1} `; });

  const linkMasks: string[] = [];

  // Helper to mask current links
  const maskLinks = () => {
    out = out.replace(LINK_RE, m => { linkMasks.push(m); return ` LINKMASK${linkMasks.length - 1} `; });
  };

  // Helper to unmask all links
  const unmaskLinks = () => {
    out = out.replace(/ LINKMASK(\d+) /g, (_, i) => linkMasks[Number(i)]);
    linkMasks.length = 0;
  };

  // Tags first (more distinctive token)
  out = out.replace(/#([a-z0-9][a-z0-9-]*)/gi, (full, tag) => {
    if (vocab.tags.has(tag.toLowerCase())) {
      return `<a class="xref tag" href="/tasks?tag=${encodeURIComponent(tag)}">#${tag}</a>`;
    }
    return full;
  });
  maskLinks();

  // Process tasks and projects together, longest first to avoid partial matches
  const allSlugs = [
    ...Array.from(vocab.tasks).map(s => ({ slug: s, type: 'task' as const })),
    ...Array.from(vocab.projects).map(s => ({ slug: s, type: 'project' as const }))
  ].sort((a, b) => b.slug.length - a.slug.length);

  for (const { slug, type } of allSlugs) {
    const re = new RegExp(`\\b${slug.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'g');
    out = out.replace(re, `<a class="xref ${type}" href="/${type}s/${slug}">${slug}</a>`);
    maskLinks();
  }

  // Final unmask of any remaining link masks
  unmaskLinks();

  return out.replace(/ CODEMASK(\d+) /g, (_, i) => codeMasks[Number(i)]);
}
