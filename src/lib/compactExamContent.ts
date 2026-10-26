// Presentation only: the source papers, answer keys and saved attempt IDs stay intact.
const blankPattern = /_{3,}|[.…]{5,}|…{2,}|(?:_[ \t\u00a0]*){6,}|(?:[.…][ \t\u00a0]*){6,}|[-–—]{10,}/g;
const printOnly = (value: string) => /^(?:[\s_.…–—-]+|[-–—\s]*(?:the\s+end|hết)[-–—\s.!]*)$/i.test(value);

export function shortenExamBlanks(value: string) {
  return value.replace(blankPattern, (blank: string, offset: number, whole: string) => {
    const before = offset > 0 && /[\p{L}\p{N})]/u.test(whole[offset - 1]) ? ' ' : '';
    const after = /[\p{L}\p{N}]/u.test(whole[offset + blank.length] ?? '') ? ' ' : '';
    return before + '____' + after;
  });
}

export function compactExamText(value: string) {
  return value.split(/\r?\n/)
    .filter(line => !printOnly(line.trim()))
    .map(line => shortenExamBlanks(line).replace(/[ \t\u00a0]+/g, ' ').trim())
    .join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function compactExamInstruction(value: string) {
  return compactExamText(value)
    .replace(/\s+([.,;:?!])/g, '$1')
    .replace(/\s+on your answer sheet\b/gi, '')
    .replace(/\s+in each of the following questions\b/gi, '')
    .replace(/\b(?:Circle|Mark) the letter A,?\s*B,?\s*C,?\s*(?:or|and)?\s*D to indicate/gi, 'Choose')
    .replace(/\bYou will listen twice\b/gi, 'Listen twice')
    .replace(/\s+([.,;:?!])/g, '$1');
}

export function compactExamHtml(value: string, options: { questionNumber?: string; manual?: boolean } = {}) {
  if (!value) return '';
  const root = document.createElement('div');
  root.innerHTML = value;

  // Remove only prefix characters, not the preceding images or their containers.
  // Do this before replacing blanks: a printed "3.……" has no separating space.
  if (options.questionNumber) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const entries: { node: Text; start: number; end: number }[] = [];
    let text = '';
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      entries.push({ node, start: text.length, end: text.length + node.length }); text += node.data;
    }
    const prefix = text.match(/^\s*(?:(?:Question\s*n?|Câu)\s*)?(\d+)\s*[.:)]\s*/i);
    if (prefix && prefix[1] === options.questionNumber) {
      for (const entry of entries) {
        if (entry.start >= prefix[0].length) break;
        entry.node.data = entry.node.data.slice(Math.min(entry.node.length, prefix[0].length - entry.start));
      }
    }
  }

  // Remove paper-only writing lines and end markers, never images or table cells.
  for (const p of root.querySelectorAll('p')) {
    if (!p.querySelector('img,table') && (!p.textContent?.trim() || printOnly(p.textContent.trim()))) p.remove();
  }
  // Some error-correction papers align A/B/C/D below four underlined phrases.
  // Attach the labels to those phrases when that mapping is unambiguous.
  for (const p of root.querySelectorAll('p')) {
    const labels = p.textContent?.trim().match(/^[A-D](?:\s+[A-D]){1,3}$/)?.[0].split(/\s+/);
    if (!labels) continue;
    const previous = p.previousElementSibling;
    const words = previous ? [...previous.querySelectorAll('u')].filter(u => u.textContent?.trim()) : [];
    const wholePhrases = words.every(word => {
      const before = document.createRange(); before.selectNodeContents(previous!); before.setEndBefore(word);
      const after = document.createRange(); after.selectNodeContents(previous!); after.setStartAfter(word);
      return !/[\p{L}\p{N}]$/u.test(before.toString()) && !/^[\p{L}\p{N}]/u.test(after.toString());
    });
    if (words.length === labels.length && wholePhrases) {
      words.forEach((word, i) => {
        const label = document.createElement('sup');
        label.className = 'exam-phrase-label'; label.textContent = ' ' + labels[i] + ' ';
        word.after(label);
      });
      p.remove();
    } else p.classList.add('exam-label-line');
  }

  // Work paragraph by paragraph so distinct blanks in different rows stay distinct.
  const blocks = [...root.querySelectorAll('p,td,th,li')].filter(el => !el.querySelector('p,td,th,li'));
  if (!blocks.length) blocks.push(root);
  for (const block of blocks) {
    if (block.closest('.exam-label-line')) continue;
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    const entries: { node: Text; start: number; end: number }[] = [];
    let text = '';
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      entries.push({ node, start: text.length, end: text.length + node.length });
      text += node.data;
    }
    for (const match of [...text.matchAll(blankPattern)].reverse()) {
      const a = entries.find(e => e.start <= match.index! && e.end > match.index!);
      const end = match.index! + match[0].length;
      const z = entries.find(e => e.start < end && e.end >= end);
      if (!a || !z) continue;
      const range = document.createRange();
      range.setStart(a.node, match.index! - a.start); range.setEnd(z.node, end - z.start);
      range.deleteContents();
      const before = match.index! > 0 && /[\p{L}\p{N})]/u.test(text[match.index! - 1]) ? ' ' : '';
      const after = /[\p{L}\p{N}]/u.test(text[end] ?? '') ? ' ' : '';
      range.insertNode(document.createTextNode(before + '____' + after));
    }
    const cleanWalker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    while (cleanWalker.nextNode()) {
      const node = cleanWalker.currentNode as Text;
      node.data = node.data.replace(/\s+/g, ' ');
    }
  }

  for (const p of root.querySelectorAll('p')) if (!p.textContent?.trim() && !p.querySelector('img,table')) p.remove();
  for (const p of root.querySelectorAll('p')) {
    if (/^(?:Mark|Circle) the letter/i.test(p.textContent?.trim() ?? '') && !p.querySelector('img')) p.textContent = compactExamInstruction(p.textContent ?? '');
  }

  // Keep marking criteria available without expanding the whole writing exercise.
  if (options.manual) {
    const rubric = [...root.children].find(el => /^(?:marking scheme|điểm toàn bài|1\s*[.)]\s*format\s*[:(])/i.test(el.textContent?.trim() ?? ''));
    if (rubric) {
      const details = document.createElement('details'); details.className = 'exam-rubric';
      const summary = document.createElement('summary'); summary.textContent = 'Tiêu chí chấm / hướng dẫn'; details.append(summary);
      root.insertBefore(details, rubric);
      let next: Element | null = rubric;
      while (next) { const following: Element | null = next.nextElementSibling; details.append(next); next = following; }
    }
  }
  return root.innerHTML;
}
