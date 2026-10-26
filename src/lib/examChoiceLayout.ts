/** Reflow only a complete, trailing set of A–D choices from trusted exam HTML.
 * DOM ranges retain the original underline, emphasis, images and question text.
 * If the source uses another structure, leave its HTML untouched.
 */
export function splitExamChoices(html: string, labels: string[] | undefined) {
  if (!labels || labels.length < 2 || labels.some(label => !/^[A-D]$/.test(label))) return null;
  const root = document.createElement('div');
  root.innerHTML = html;
  const nodes: { node: Text; start: number; end: number }[] = [];
  let text = '';
  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const value = node.textContent ?? '';
      nodes.push({ node: node as Text, start: text.length, end: text.length + value.length });
      text += value;
      return;
    }
    const block = node instanceof Element && /^(P|DIV|BR|TR|TD|LI)$/.test(node.tagName);
    if (block) text += '\n';
    if (node instanceof Element && node.tagName === 'IMG') text += '\uFFFC';
    node.childNodes.forEach(walk);
    if (block) text += '\n';
  }
  walk(root);
  const matches = [...text.matchAll(/(?<![a-zA-Z])([A-D])\s*[.)]\s*/g)];
  // Arrangement questions may label their sentences A–E before their answers.
  // Only the last complete answer sequence is eligible for reflow.
  const tail = matches.slice(-labels.length);
  if (tail.length !== labels.length || tail.some((m, i) => m[1] !== labels[i])) return null;
  const positions = tail.map(m => {
    const entry = nodes.find(n => n.start <= m.index! && n.end > m.index!);
    return entry && { node: entry.node, offset: m.index! - entry.start };
  });
  if (positions.some(p => !p)) return null;
  const fragment = (start: number | null, end: number | null) => {
    const range = document.createRange();
    range.selectNodeContents(root);
    if (start !== null) range.setStart(positions[start]!.node, positions[start]!.offset);
    if (end !== null) range.setEnd(positions[end]!.node, positions[end]!.offset);
    const holder = document.createElement('div');
    holder.append(range.cloneContents());
    return holder.innerHTML;
  };
  const choices = tail.map((m, i) => ({ label: labels[i], html: fragment(i, i + 1 < labels.length ? i + 1 : null), text: text.slice(m.index! + m[0].length, tail[i + 1]?.index).trim() }));
  if (choices.some(c => !c.text || /\uFFFC/.test(c.text))) return null;
  const longest = Math.max(...choices.map(c => c.text.replace(/\s+/g, ' ').length));
  return { stemHtml: fragment(null, 0), choices, size: longest <= 18 ? 'short' : longest <= 120 ? 'medium' : 'long', tiny: longest <= 8 };
}
