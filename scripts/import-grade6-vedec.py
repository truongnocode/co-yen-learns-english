"""Import the teacher's VEDEC DOCX papers and keys without changing their sources.

Usage: python scripts/import-grade6-vedec.py SOURCE_FOLDER [--grade 6|7|8] [--audio]
The generated review in tmp/gradeN-import must be checked before publishing.
"""
import argparse
import difflib
import hashlib
import html
import json
from pathlib import Path
import re
import shutil
import subprocess
import xml.etree.ElementTree as ET
import zipfile
from html.parser import HTMLParser

W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
A = '{http://schemas.openxmlformats.org/drawingml/2006/main}'
V = '{urn:schemas-microsoft-com:vml}'
BASE = Path(__file__).resolve().parents[1]
OUT = BASE / 'public/data/grade6-midterm'
REVIEW = BASE / 'tmp/grade6-import'
DATA_URL = '/data/grade6-midterm'
GRADE = 6
QUESTION = re.compile(r'^\s*(?:Question\s*n?|Câu\s*)?(\d+)\s*[.:)]\s*', re.I)
MAIN = re.compile(r'^(?:PART\s+[A-E]\s*[:.–—-]?\s*|[A-EIVX]+\s*[.:–—-]\s*)?(LISTENNING|LISTENING|LANGUAGE(?:\s*FOCUS)?|READING|WRITING|SPEAKING)\b')
SUB = re.compile(r'^(?:[IVX]+\s*[.:]\s*(?:Listen|Read|Write|Choose|Circle|Find|Supply|Give|Complete|Rewrite|Rearrange?|Reorder|Put|Use|Fill|Phonetics|Answer|Mark|Talk|Part\s*2|You will)\b|[A-C]\s*[.:]\s*(?:Read the|Write\s*\(|Answer the|Look at))', re.I)

class HtmlSlice(HTMLParser):
    def __init__(self,start,end):
        super().__init__(convert_charrefs=True);self.start=start;self.end=end;self.pos=0;self.out=[];self.stack=[]
    def handle_starttag(self,tag,attrs):
        raw=self.get_starttag_text()
        if tag in ('img','br'):
            if self.start<=self.pos<self.end:self.out.append(raw)
            if tag=='br':self.pos+=1
        else:
            emitted=self.start<=self.pos<self.end
            self.stack.append([tag,raw,emitted])
            if emitted:self.out.append(raw)
    def handle_endtag(self,tag):
        if self.stack and self.stack[-1][0]==tag:
            item=self.stack.pop()
            if item[2]:self.out.append('</'+tag+'>')
    def handle_data(self,data):
        a=max(0,self.start-self.pos);b=min(len(data),self.end-self.pos)
        if a<b:
            for item in self.stack:
                if not item[2]:self.out.append(item[1]);item[2]=True
            self.out.append(html.escape(data[a:b]))
        self.pos+=len(data)

def split_blocks(blocks):
    result=[]
    for b in blocks:
        # Break combined Word paragraphs into individual numbered questions.
        if not b['text'].strip():
            if '<img' in b['html']:result.append(b)
            continue
        cuts=[m.start(1) for m in re.finditer(r'(?:^|[\s])((?:Question\s*n?|Câu\s*)?\d+\s*[.:)]\s*(?!\d))',b['text'],re.I)]
        cuts=[i for i in cuts if i>0 and b['text'][:i].strip() and ('\n' in b['text'][max(0,i-2):i] or re.match(r'(?:Question\s*)?\d+[.:)]\s*A\.',b['text'][i:],re.I) or b['text'][i-1]=='\t' or GRADE in (7,8) and b['text'][i:].startswith('Question '))]
        if GRADE==8:
            cuts += [m.start(1) for m in re.finditer(r'(?<!\S)((?:Question\s+\d+[.:]|\d+\.\s+)(?=[A-Z]))',b['text']) if m.start(1)>0 and re.search(r'=>|→|->|⇒',b['text'][:m.start(1)])]
            cuts += [m.start(1) for m in re.finditer(r'(?<!\S)((?:PART\s+[A-E][.:]|[A-EIVX]+\.)\s*(?:LISTENING|LANGUAGE|READING|WRITING|Rewrite\b|Complete the second\b|Write a paragraph\b|Rearrange\b))',b['text']) if m.start(1)>0]
            cuts=sorted(set(cuts))
        starts=[0]+cuts;ends=cuts+[len(b['text'])]
        for a,z in zip(starts,ends):
            if not b['text'][a:z].strip():continue
            if len(starts)==1:result.append(b);continue
            parser=HtmlSlice(a,z);parser.feed(b['html'])
            result.append({**b,'text':b['text'][a:z],'html':''.join(parser.out),'marks':[i-a for i in b['marks'] if a<=i<z],'bolds':[i-a for i in b['bolds'] if a<=i<z]})
    return result

def clean(s):
    return re.sub(r'\s+', ' ', s).strip()

def norm(s):
    return clean(s).lower().replace('’', "'").replace('‘', "'")

def read_doc(path, exam_id, is_key=False):
    with zipfile.ZipFile(path) as z:
        rels = ET.fromstring(z.read('word/_rels/document.xml.rels'))
        targets = {e.get('Id'): e.get('Target') for e in rels}
        tree = ET.fromstring(z.read('word/document.xml'))
        numbering=ET.fromstring(z.read('word/numbering.xml')) if 'word/numbering.xml' in z.namelist() else ET.Element('empty')
        abstracts={e.get(W+'abstractNumId'):e for e in numbering.findall(W+'abstractNum')}
        nums={e.get(W+'numId'):e for e in numbering.findall(W+'num')}
        counters={}

        def paragraph(p):
            text, markup, marks, bolds = '', '', [], []
            for run in p.iter(W+'r'):
                value = ''.join(n.text or '' if n.tag == W+'t' else '\t' if n.tag == W+'tab' else '\n' if n.tag == W+'br' else '' for n in run)
                start = len(text)
                text += value
                highlight = run.find(W+'rPr/'+W+'highlight')
                shade = run.find(W+'rPr/'+W+'shd')
                bold = run.find(W+'rPr/'+W+'b')
                if highlight is not None and highlight.get(W+'val') not in ('none', 'white') or shade is not None and shade.get(W+'fill') in ('FFFF00','00FF00'):
                    marks.extend(range(start, len(text)))
                if bold is not None and bold.get(W+'val') not in ('0', 'false'):
                    bolds.extend(range(start, len(text)))
                escaped = html.escape(value).replace('\n', '<br>')
                underline = run.find(W+'rPr/'+W+'u')
                if underline is not None and underline.get(W+'val') != 'none':
                    escaped = '<u>'+escaped+'</u>'
                if bold is not None and bold.get(W+'val') not in ('0', 'false'):
                    escaped = '<strong>'+escaped+'</strong>'
                markup += escaped
                images = [(n.get(R+'embed')) for n in run.iter(A+'blip')]
                images += [(n.get(R+'id')) for n in run.iter(V+'imagedata')]
                for rid in images:
                    target = targets.get(rid, '')
                    if not target or is_key:
                        continue
                    data = z.read('word/'+target.lstrip('/'))
                    filename = hashlib.sha256(data).hexdigest()[:16]+Path(target).suffix.lower()
                    image_dir = OUT/'images'; image_dir.mkdir(parents=True, exist_ok=True)
                    (image_dir/filename).write_bytes(data)
                    markup += f'<img src="{DATA_URL}/images/{filename}" alt="Hình minh họa của câu hỏi" loading="lazy">'
            auto=None
            if re.match(r'^\s*2…',text):auto='2'
            if re.match(r'^\s*\d+\s+[A-Z]',text):auto=re.match(r'^\s*(\d+)',text).group(1)
            if re.match(r'^\s*l\.\s*How old are Hoa',text):auto='1'
            np=p.find(W+'pPr/'+W+'numPr')
            if np is not None and (GRADE!=8 or clean(text) or '<img' in markup):
                nid=np.find(W+'numId');level=np.find(W+'ilvl')
                num=nums.get(nid.get(W+'val')) if nid is not None else None
                if num is not None:
                    aid=num.find(W+'abstractNumId');ab=abstracts.get(aid.get(W+'val')) if aid is not None else None
                    lev=next((e for e in ab.findall(W+'lvl') if e.get(W+'ilvl')==(level.get(W+'val') if level is not None else '0')),None) if ab is not None else None
                    if lev is not None:
                        fmt=lev.find(W+'numFmt');format_name=fmt.get(W+'val') if fmt is not None else ''
                        counter_key=(nid.get(W+'val'),level.get(W+'val') if level is not None else '0')
                        start_node=lev.find(W+'start');start_num=int(start_node.get(W+'val','1')) if start_node is not None else 1
                        counters[counter_key]=counters.get(counter_key,start_num-1)+1
                        if format_name=='decimal' and not QUESTION.match(text):auto=str(counters[counter_key])
                        elif format_name=='upperLetter' and not re.match(r'^\s*[A-D][.)]',text):
                            prefix=chr(64+counters[counter_key])+'. '
                            text=prefix+text;markup=html.escape(prefix)+markup;marks=[i+len(prefix) for i in marks];bolds=[i+len(prefix) for i in bolds]
                        elif GRADE==8 and format_name=='lowerLetter' and not re.match(r'^\s*[a-z][.):]',text):
                            prefix=chr(96+counters[counter_key])+'. '
                            text=prefix+text;markup=html.escape(prefix)+markup;marks=[i+len(prefix) for i in marks];bolds=[i+len(prefix) for i in bolds]
            return {'text': text, 'html': '<p>'+markup+'</p>', 'marks': marks, 'bolds': bolds, 'autoNumber':auto}

        blocks = []
        for child in tree.find(W+'body'):
            if child.tag == W+'p':
                b = paragraph(child)
                if clean(b['text']) or '<img' in b['html']:
                    blocks.append(b)
            elif child.tag == W+'tbl':
                for row in child.findall(W+'tr'):
                    cells = []
                    for cell in row.findall(W+'tc'):
                        ps = [paragraph(p) for p in cell.iter(W+'p')]
                        cells.append(ps)
                    # Keep a true/false statement and its answer in one block.
                    statement_cells=cells[:-2] if len(cells)>=4 and clean(''.join(p['text'] for p in cells[0])).rstrip('.').isdigit() else cells[:1]
                    answer_cells=cells[len(statement_cells):]
                    if len(cells) >= 2 and not any('<img' in p['html'] for c in answer_cells for p in c) and all(not clean(''.join(p['text'] for p in c)) or clean(''.join(p['text'] for p in c)).upper() in ('T','F','TRUE','FALSE','T (TRUE)','F (FALSE)','T/F','✓','√','X') for c in answer_cells):
                        flat = [p for c in cells for p in c]
                        text = ' '.join(p['text'] for p in flat)
                        answer_text=' '.join(p['text'] for c in answer_cells for p in c)
                        # Some answer keys mark the selected T/F column with a tick.
                        selected=None
                        if len(answer_cells)==2:
                            for ci,c in enumerate(answer_cells):
                                for p in c:
                                    if p['marks'] or clean(p['text']) in ('✓','√','X','x'):selected=['T','F'][ci]
                        blocks.append({'text':text,'html':''.join(p['html'] for c in statement_cells for p in c),'marks':[], 'bolds':[], 'tf':True,'tfAnswer':selected,'autoNumber':next((p.get('autoNumber') for c in statement_cells for p in c if p.get('autoNumber')),None)})
                    else:
                        if len(cells)>1 and len(cells[0])>1 and all(len(c)==len(cells[0]) for c in cells) and any(QUESTION.match(p['text']) for p in cells[0]):
                            flat=[p for line in zip(*cells) for p in line]
                        else:flat=[p for c in cells for p in c]
                        if len(cells)>1 and re.fullmatch(r'\s*\d+\.?\s*',flat[0]['text']):
                            flat[0]['text']=flat[0]['text'].strip().rstrip('.')+'. '
                            if len(flat)>1:
                                prefix=flat[0]['text']; flat[1]={**flat[1],'text':prefix+flat[1]['text'],'html':'<p>'+html.escape(prefix)+'</p>'+flat[1]['html'],'marks':[i+len(prefix) for i in flat[1]['marks']],'bolds':[i+len(prefix) for i in flat[1]['bolds']]};flat=flat[1:]
                        blocks.extend(p for p in flat if clean(p['text']) or '<img' in p['html'])
        return split_blocks([b for b in blocks if not re.fullmatch(r'[\s_…\.]+',b['text']) or '<img' in b['html']])

def sections(blocks):
    result, current, main = [], None, ''
    for b in blocks:
        t = clean(b['text'])
        if re.search(r'TRANSCRIPT|TRANSCRIPTION|Audio transcript', t, re.I):
            break
        m = MAIN.match(t)
        grade7_heading=False
        if GRADE in (7,8):
            section_main=MAIN.match(re.sub(r'^SECTION\s+','',t))
            if section_main and t.startswith('SECTION '):
                main=section_main.group(1).upper();grade7_heading=True
            if re.match(r'^(?:II\.\s*KNOWLEDGE OF LANGUAGE|B\.\s*USE OF LANGUAGE|PART B:\s*VOCABULARY AND GRAMMAR)',t,re.I):
                main='LANGUAGE FOCUS';grade7_heading=True
            if re.match(r'^(?:Choose the|Read (?:the|and)|Odd one out|Four phrases|Put the sentences)',t,re.I):
                if t.startswith(('Read','Four phrases')):main='READING'
                elif 'sentence that is' in t or t.startswith('Put the sentences'):main='WRITING'
                elif not main:main='LANGUAGE FOCUS'
                grade7_heading=True
            if re.match(r'^[IVX]+\.\s*Arrange\b',t,re.I):grade7_heading=True
            if re.match(r'^PART\s+\d+\b',t):grade7_heading=True
            if re.match(r'^Task\s+\d+[.:]\s*Listen',t,re.I):grade7_heading=True
        if GRADE==8:
            if re.match(r'^Write (?:a |an |short )?(?:paragraph|passage)',t,re.I):main='WRITING';grade7_heading=True
            if re.match(r'^(?:Listen to |Listen and |Part [IVX]+[.:]|Questions? [12]:\s*(?:Choose|Read|Listen|Rewrite))',t,re.I):grade7_heading=True
            if re.match(r'^[A-EIVX]+\.\s*KNOWLEDGE OF LANGUAGE',t,re.I):main='LANGUAGE FOCUS';grade7_heading=True
            if re.match(r'^Put the words',t,re.I):main='WRITING';grade7_heading=True
            if re.match(r'^Choose the (?:word|best option|letter.*underlined part)',t,re.I):main='LANGUAGE FOCUS'
        if m:
            main = m.group(1).upper().replace('LISTENNING','LISTENING')
            if main=='LANGUAGE':main='LANGUAGE FOCUS'
        numeric_heading=re.match(r'^\d+\.\s*(?:Circle the letter|Which underlined|Choose the correct answer)',t) and len(t)<240 and not re.search(r'\bA\.',t)
        heading = bool(m or SUB.match(t) or numeric_heading or grade7_heading or re.match(r'^Part\s+\d+\b|^[IVX]+\.\s*(?:\(|$)',t) or re.match(r'^B:\s*Choose',t))
        # A handful of papers put a part heading and its instruction in one paragraph.
        if heading:
            current = {'title': t, 'part': main, 'blocks': []}
            result.append(current)
        elif current is not None:
            current['blocks'].append(b)
    return result

def questions(section):
    intro, qs, current = [], [], None
    manual = section['part'] == 'SPEAKING' or bool(re.search(r'Write\s+(?:a\s+)?(?:short\s+)?(?:paragraph|passage)',section['title'],re.I)) or GRADE in (7,8) and any(re.match(r'^Write a paragraph',clean(b['text']),re.I) for b in section['blocks'])
    if manual:
        return [], [{'number':'1','blocks':section['blocks'], 'manual':True}]
    blocks=section['blocks']
    if GRADE in (7,8) and not any(QUESTION.match(clean(b['text'])) or b.get('autoNumber') for b in blocks):
        # Some papers print one unnumbered A-D option row per blank.
        counter=0;prepared=[]
        for b in blocks:
            if re.match(r'^\s*A\.',b['text']):
                counter+=1;b={**b,'autoNumber':str(counter)}
            prepared.append(b)
        blocks=prepared
    for b in blocks:
        t=clean(b['text'])
        m=QUESTION.match(t)
        auto=b.get('autoNumber') if GRADE in (7,8) or not re.match(r'^\s*[A-D]\.',t) else None
        if GRADE==8 and re.match(r'^[A-D]\.',t) and current and current['blocks'] and QUESTION.match(current['blocks'][0]['text']):auto=None
        if re.fullmatch(r'(?:STATEMENTS?|SENTENCES)\s+(?:TRUE FALSE|T F|T/F)',t,re.I):
            continue
        is_tf = b.get('tf') and len(t)>20 and not re.search(r'\b[A-D]\.',t) and not (GRADE in (7,8) and re.search(r'will listen twice|statements.*true',t,re.I))
        if m or is_tf or auto:
            current={'number':m.group(1) if m else auto or str(len(qs)+1), 'blocks':[]}
            qs.append(current)
        if current is not None:
            current['blocks'].append(b)
        else:
            intro.append(b)
        if current and re.search(r'Write\s+(?:a\s+)?(?:short\s+)?(?:paragraph|passage)',t,re.I):
            current['manual']=True
    # Keep paragraph prompts and their numbered cues together.
    if GRADE in (7,8) and intro and qs and len(set(re.findall(r'(?<![a-z])([A-D])\s*\.',joined(intro))))>=2 and not re.search(r'\(\d+\).*[_…]',joined(intro)):
        qs.insert(0,{'number':'1','blocks':intro});intro=[]
    for i,q in enumerate(qs):
        if q.get('manual'):
            q['blocks']+= [b for rest in qs[i+1:] for b in rest['blocks']]
            qs=qs[:i+1];break
    if not qs and intro and section['part'] in ('WRITING','LANGUAGE FOCUS') and re.search(r'Reorder|Rearrang|Use|Give|Supply',section['title'],re.I):
        qs=[{'number':'1','blocks':intro}];intro=[]
    # Unnumbered arrangement questions still need an answer control.
    if not qs and any(re.search(r'\bA\.',b['text']) for b in intro):
        qs=[{'number':'1','blocks':intro}]; intro=[]
    if not qs:
        blank_pattern=r'\((\d+)\)\s*(?:[_…\.]\s*){2,}' if GRADE==8 else r'\((\d+)\)\s*[_…\.]{2,}'
        blank_numbers=list(dict.fromkeys(re.findall(blank_pattern,joined(intro))))
        qs=[{'number':n,'blocks':[{'text':f'Chỗ trống ({n})','html':f'<p>Chỗ trống ({n})</p>','marks':[],'bolds':[]}]} for n in blank_numbers]
    return intro,qs

def joined(blocks, field='text'):
    return '\n'.join(b[field] for b in blocks)

def option_answer(blocks):
    text=''; highlighted=set();bolds=set()
    for b in blocks:
        start=len(text);text+=b['text']+'\n'
        highlighted.update(start+i for i in b['marks']);bolds.update(start+i for i in b['bolds'])
    labels=list(re.finditer(r'(?<![a-z])([A-D])\s*[.)]\s*',text))
    choices=[]
    for i,m in enumerate(labels):
        end=labels[i+1].start() if i+1<len(labels) else len(text)
        span=set(range(m.start(), end)); content=text[m.end():end].strip()
        if not content:continue
        choices.append((m.group(1), len(span & highlighted),len(span & bolds)/max(1,len(span))))
    hits=[c[0] for c in choices if c[1]>0]
    if len(hits)==1:return hits
    hits=[c[0] for c in choices if c[2]>.6]
    return hits if len(hits)==1 else []

def answer_for(q, k, kind):
    source=joined(q['blocks']); key=joined(k['blocks'])
    if kind=='choice': return option_answer(k['blocks'])
    if kind=='tf':
        selected=next((b.get('tfAnswer') for b in k['blocks'] if b.get('tfAnswer')),None)
        if selected:return [selected]
        ts=re.findall(r'\b([TF])\b',key)
        if ts:return [ts[-1]]
    # Changed/added words, retaining all filled blanks in reading and listening.
    plain=lambda x: re.sub(r'[_…\.]{2,}', ' ',x)
    a,b=plain(source),plain(key)
    differences=[]
    for tag,i,j,x,y in difflib.SequenceMatcher(None,a,b,autojunk=False).get_opcodes():
        if tag in ('insert','replace') and b[x:y].strip():differences.append(b[x:y].strip())
    # Prefer highlighted inserted answers when the document supplies them.
    marked=' '.join(''.join(b['text'][i] for i in b['marks']) for b in k['blocks']).strip()
    marked=clean(marked)
    if marked and len(marked)<180 and not re.search(r'\b[A-D]\.',marked):
        return [marked.strip(' ._…')]
    additions=clean(' '.join(differences)).strip(' ._…')
    additions=re.sub(r'^[=→>\-\s]+','',additions)
    return [additions] if additions else []

def main():
    global OUT, REVIEW, DATA_URL, GRADE
    ap=argparse.ArgumentParser();ap.add_argument('source',type=Path);ap.add_argument('--audio',action='store_true');ap.add_argument('--grade',type=int,choices=[6,7,8],default=6);args=ap.parse_args()
    OUT=BASE/f'public/data/grade{args.grade}-midterm';REVIEW=BASE/f'tmp/grade{args.grade}-import';DATA_URL=f'/data/grade{args.grade}-midterm'
    GRADE=args.grade
    OUT.mkdir(parents=True,exist_ok=True);REVIEW.mkdir(parents=True,exist_ok=True)
    manifest=[];reports=[];used_audio=set()
    override_path=BASE/f'scripts/grade{args.grade}-vedec-overrides.json'
    overrides=json.loads(override_path.read_text(encoding='utf-8')) if override_path.exists() else {}
    for directory in sorted(args.source.iterdir()):
        if not directory.is_dir() or not re.match(r'^\d{2}\.',directory.name):continue
        num=directory.name[:2];exam_id=('vedec-2026-' if args.grade==6 else f'vedec-g{args.grade}-2026-')+num
        previous=json.loads((OUT/(exam_id+'.json')).read_text(encoding='utf-8')) if (OUT/(exam_id+'.json')).exists() else {}
        if args.grade==8:
            docs=list(directory.glob('*.docx'))
            key,= [f for f in docs if 'ĐÁP ÁN' in f.name.upper()]
            paper,= [f for f in docs if f!=key and 'NỘI DUNG' not in f.name.upper()]
        else:
            paper=next(directory.glob('2.*.docx'));key=next(directory.glob('3.*.docx'))
        src_sections=sections(read_doc(paper,exam_id)); key_sections=sections(read_doc(key,exam_id,True))
        exam={'id':exam_id,'number':int(num),'title':f'Đề {int(num):02d}', 'subtitle':f'Tiếng Anh {args.grade} · Global Success · Giữa học kỳ I · VEDEC 2026','sections':[],'audio':[], 'sourceHash':hashlib.sha256(paper.read_bytes()).hexdigest()}
        reports.append(f'\nEXAM {num} source sections={len(src_sections)} key sections={len(key_sections)}')
        for si,s in enumerate(src_sections):
            intro,qs=questions(s)
            if not qs:
                # Keep passages and main headings as context, never discard content.
                exam['sections'].append({'id':f's{si+1}','title':s['title'],'part':s['part'],'introHtml':joined(intro,'html'),'questions':[]})
                continue
            # Match within the same main part; section titles may differ in point labels.
            candidates=[ks for ks in key_sections if ks['part']==s['part']]
            ks=max(candidates,key=lambda x:difflib.SequenceMatcher(None,norm(s['title']),norm(x['title'])).ratio(),default={'title':'','part':s['part'],'blocks':[]})
            _,kqs=questions(ks)
            sec={'id':f's{si+1}','title':s['title'],'part':s['part'],'introHtml':joined(intro,'html'),'questions':[]}
            for qi,q in enumerate(qs):
                qid=f's{si+1}-q{qi+1}';text=joined(q['blocks']);k=next((kq for kq in kqs if kq['number']==q['number']),{'blocks':[]})
                def stem(qq):
                    first=qq['blocks'][0]['text'] if qq['blocks'] else ''
                    return norm(re.sub(r'[_…\.]{2,}',' ',QUESTION.sub('',first)))
                pool=[(cs,kq) for cs in candidates for kq in questions(cs)[1]]
                if pool and (GRADE==6 or not k['blocks']):
                    _,best=max(pool,key=lambda pair:(.8*difflib.SequenceMatcher(None,stem(q),stem(pair[1])).ratio()+.2*difflib.SequenceMatcher(None,norm(s['title']),norm(pair[0]['title'])).ratio()))
                    if difflib.SequenceMatcher(None,stem(q),stem(best)).ratio()>.55 and len(stem(q))>5:k=best
                choices=list(dict.fromkeys(re.findall(r'(?<![a-z])([A-D])\s*\.\s*',text)))
                tf=any(b.get('tf') for b in q['blocks']) or bool(re.search(r'true|false|\bT\b.*\bF\b',s['title'],re.I)) and not re.search(r'_{3,}',text)
                kind='manual' if q.get('manual') else 'choice' if len(choices)>=2 else 'tf' if tf else 'text'
                answers=[] if kind=='manual' else answer_for(q,k,kind)
                item={'id':qid,'number':q['number'],'html':joined(q['blocks'],'html'),'kind':kind,'answers':answers}
                if GRADE==8 and not QUESTION.match(text):
                    printed_number=re.match(r'^\s*(\d+)(?=[.…])',text)
                    heading_number=re.match(r'^(\d+)\.\s*(?:Circle the letter|Which underlined|Choose the correct answer)',s['title']) if qi==0 else None
                    if printed_number or heading_number:item['number']=(printed_number or heading_number).group(1)
                if kind=='choice':item['options']=sorted(choices)
                if kind=='tf':item['options']=['T','F']
                if k['blocks']: item['referenceHtml']=joined(k['blocks'],'html')
                if kind=='text' and k['blocks']:
                    last=clean(k['blocks'][-1]['text'])
                    last=re.sub(r'^[=→>\-\s]+','',last)
                    if not QUESTION.match(last) and len(last)<220 and not re.search(r'[_…]{2,}',last):
                        item['answers']=list(dict.fromkeys(item['answers']+[last]))
                if kind=='text':
                    item['answers']=[re.sub(r'^[=→>\-\s]+','',a) for a in item['answers']]
                    expanded=[]
                    for a in item['answers']:
                        expanded.extend(p.strip() for p in a.split('/') if p.strip())
                    item['answers']=list(dict.fromkeys(expanded))
                item.update(overrides.get(num,{}).get(qid,{}))
                if item['kind']=='text':
                    item['answers']=list(dict.fromkeys(clean(re.sub(r'[_…]+|\.{2,}', ' ',a)) for a in item['answers']))
                sec['questions'].append(item)
                reports.append(f"{qid} [{item['kind']}] #{q['number']} {clean(text)[:100]} => {item['answers']}")
            exam['sections'].append(sec)
        speaking=[s for s in exam['sections'] if s['part']=='SPEAKING']
        if speaking:
            first=speaking[0]
            combined=''.join(('<p><strong>'+html.escape(s['title'])+'</strong></p>' if s is not first else '')+s['introHtml']+''.join(q['html'] for q in s['questions']) for s in speaking)
            reference=''.join(q.get('referenceHtml','') for s in speaking for q in s['questions'])
            first['introHtml']=''
            first['questions']=[{'id':first['id']+'-q1','number':'Nói','html':combined,'kind':'manual','answers':[],'referenceHtml':reference}]
            exam['sections']=[s for s in exam['sections'] if s['part']!='SPEAKING' or s is first]
        audio_files=sorted(f for f in directory.iterdir() if f.suffix.lower() in ('.mp3','.wav','.wma','.m4a'))
        # Paper 14's filenames are reversed: the Nam interview is part I;
        # Mai's house recording is part II (identical source files in papers 02/11).
        if (args.grade==6 or args.grade==8) and num=='14':audio_files.reverse()
        for ai,f in enumerate(audio_files):
            name=f'{exam_id}-{ai+1}.mp3';dest=OUT/'audio'/name
            source_hash=hashlib.sha256(f.read_bytes()).hexdigest()
            old_tracks=previous.get('audio',[])
            source_changed=ai>=len(old_tracks) or old_tracks[ai].get('sourceHash')!=source_hash
            if args.audio:
                dest.parent.mkdir(parents=True,exist_ok=True)
                if not dest.exists() or source_changed:
                    subprocess.run(['ffmpeg','-y','-v','error','-nostdin','-i',str(f),'-map','0:a:0','-codec:a','libmp3lame','-b:a','96k',str(dest)],check=True)
            duration=None
            if dest.exists():
                duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(dest)],text=True).strip())
            exam['audio'].append({'title':f'Bài nghe {ai+1}' if len(audio_files)>1 else 'Bài nghe đầy đủ', 'sourceName':f.name,'sourceHash':source_hash,'src':DATA_URL+'/audio/'+name,'duration':duration})
        for sid,patch in overrides.get(num,{}).get('__sections',{}).items():
            next(s for s in exam['sections'] if s['id']==sid).update(patch)
        if '__audio' in overrides.get(num,{}):exam['audio']=overrides[num]['__audio']
        if GRADE in (7,8):
            # Empty speaking placeholders are retained as headings, not fake tasks.
            for s in exam['sections']:
                if s['part']=='SPEAKING' and all(re.fullmatch(r'\W*The end\W*',clean(re.sub('<[^>]+>','',q['html'])),re.I) for q in s['questions']):s['questions']=[]
        (OUT/(exam_id+'.json')).write_text(json.dumps(exam,ensure_ascii=False,indent=2),encoding='utf-8')
        used_audio.update(Path(a['src']).name for a in exam['audio'])
        manifest.append({k:exam[k] for k in ('id','number','title','subtitle')} | {'questionCount':sum(len(s['questions']) for s in exam['sections']), 'audioCount':len(exam['audio'])})
    (OUT/'index.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
    (REVIEW/'review.txt').write_text('\n'.join(reports),encoding='utf-8')
    if GRADE in (7,8):
        # Only remove generated recordings superseded by reviewed mappings.
        # Original teacher files are never modified.
        for generated in (OUT/'audio').glob(f'vedec-g{GRADE}-2026-*.mp3'):
            if generated.name not in used_audio:generated.unlink()
    print(f'Imported {len(manifest)} papers. Review: {REVIEW / "review.txt"}')

if __name__=='__main__':main()
