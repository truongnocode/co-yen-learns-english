import json
import re
import sys
import warnings

warnings.filterwarnings("ignore")


def core(text):
    return re.sub(r"^[^A-Za-z0-9']+|[^A-Za-z0-9']+$", "", str(text or "")).lower()


def whitespace_tokens(text):
    return [
        {"text": match.group(0), "start": match.start(), "end": match.end(), "core": core(match.group(0))}
        for match in re.finditer(r"\S+", text or "")
    ]


def add_score(boundaries, index, key, amount, source, label=None):
    if index < 0 or index >= len(boundaries):
        return
    boundaries[index][key] += amount
    if source not in boundaries[index]["sources"]:
        boundaries[index]["sources"].append(source)
    if label and label not in boundaries[index]["labels"]:
        boundaries[index]["labels"].append(label)


def token_word_map(doc, ws_tokens):
    mapping = {}
    word_to_tokens = [[] for _ in ws_tokens]
    cursor = 0
    for token in doc:
        token_core = core(token.text)
        if not token_core:
            continue
        while cursor < len(ws_tokens) and token.idx >= ws_tokens[cursor]["end"]:
            cursor += 1
        if cursor < len(ws_tokens) and ws_tokens[cursor]["start"] <= token.idx < ws_tokens[cursor]["end"]:
            mapping[token.i] = cursor
            word_to_tokens[cursor].append(token)
    return mapping, word_to_tokens


def constituent_spans(doc, mapping):
    spans = []
    for sent in doc.sents:
        try:
            constituents = list(sent._.constituents)
        except Exception:
            constituents = []
        for span in constituents:
            labels = list(getattr(span._, "labels", ()) or ())
            if not labels:
                continue
            mapped = [mapping[token.i] for token in span if token.i in mapping]
            if not mapped:
                continue
            start = min(mapped)
            end = max(mapped) + 1
            if end - start < 2:
                continue
            spans.append({"start": start, "end": end, "label": labels[0]})
    for span in spans:
        span["depth"] = sum(
            1
            for other in spans
            if other is not span and other["start"] <= span["start"] and other["end"] >= span["end"]
        )
    return spans


CLAUSE_LABELS = {"S", "SBAR", "SBARQ", "SINV", "SQ"}
PHRASE_LABELS = {"NP", "VP", "PP", "ADJP", "ADVP", "WHNP", "WHADVP"}
TIGHT_LABELS = {"NP", "PP", "ADJP", "ADVP", "QP", "PRT"}
LEFT_EDGE_LABELS = {"SBAR", "PP", "ADVP", "WHADVP"}
TO_SKIP_WORDS = {"not", "never", "just", "really", "quickly", "slowly"}
CLAUSE_STARTERS = {"and", "but", "because", "if", "when", "while", "where", "which", "who", "that", "so"}


def apply_constituency(boundaries, spans, ws_count):
    edge_indexes = set()
    for span in spans:
        start = span["start"]
        end = span["end"]
        label = span["label"]
        length = end - start
        right_boundary = end - 1
        left_boundary = start - 1

        if right_boundary < ws_count - 1:
            if label in CLAUSE_LABELS:
                add_score(boundaries, right_boundary, "breakScore", 3.2, "constituency", label)
            elif label in PHRASE_LABELS and length >= 3:
                add_score(boundaries, right_boundary, "breakScore", 1.35, "constituency", label)
            if boundaries[right_boundary]["depth"] is None or span["depth"] < boundaries[right_boundary]["depth"]:
                boundaries[right_boundary]["depth"] = span["depth"]
            edge_indexes.add(right_boundary)

        if left_boundary >= 0 and label in LEFT_EDGE_LABELS and length >= 3:
            add_score(boundaries, left_boundary, "breakScore", 0.9, "constituency", label)
            if boundaries[left_boundary]["depth"] is None or span["depth"] < boundaries[left_boundary]["depth"]:
                boundaries[left_boundary]["depth"] = span["depth"]
            edge_indexes.add(left_boundary)

    for span in spans:
        label = span["label"]
        start = span["start"]
        end = span["end"]
        length = end - start
        if label not in TIGHT_LABELS or length > 6:
            continue
        for boundary in range(start, end - 1):
            if boundary in edge_indexes:
                continue
            add_score(boundaries, boundary, "noBreakScore", 3.1, "tight-phrase", label)


def apply_dependency(boundaries, ws_tokens, word_to_tokens):
    for index in range(len(boundaries)):
        left_tokens = word_to_tokens[index]
        right_tokens = word_to_tokens[index + 1]
        if not left_tokens or not right_tokens:
            continue

        previous = left_tokens[-1]
        next_token = right_tokens[0]
        previous_core = core(previous.text)
        next_core = core(next_token.text)
        after_next = word_to_tokens[index + 2][0] if index + 2 < len(word_to_tokens) and word_to_tokens[index + 2] else None
        after_next_core = core(after_next.text) if after_next else ""

        if previous.tag_ == "TO" and next_token.tag_.startswith("VB"):
            # "to" + infinitive verb is a tight unit; never pause between them.
            # Any break belongs BEFORE "to" (handled by the infinitive-marker rule).
            add_score(boundaries, index, "noBreakScore", 4.0, "infinitive-head", "TO+VB")
        if next_core == "to" and next_token.tag_ == "TO":
            head = after_next_core
            if head in TO_SKIP_WORDS and index + 3 < len(word_to_tokens) and word_to_tokens[index + 3]:
                head = core(word_to_tokens[index + 3][0].text)
            if head:
                add_score(boundaries, index, "noBreakScore", 4.9, "infinitive-marker", "TO")

        if previous.pos_ == "ADP" or previous.dep_ in {"case", "mark"}:
            add_score(boundaries, index, "noBreakScore", 3.6, "dependency", previous.dep_ or previous.pos_)
        if previous.dep_ in {"det", "poss", "compound", "amod", "aux", "auxpass", "neg"}:
            add_score(boundaries, index, "noBreakScore", 2.4, "dependency", previous.dep_)
        if previous.dep_ == "amod" and next_token.pos_ in {"NOUN", "PROPN"}:
            add_score(boundaries, index, "noBreakScore", 1.1, "adjective-noun", previous.dep_)
        if previous.dep_ in {"nsubj", "nsubjpass", "csubj", "expl"} and next_token.pos_ in {"AUX", "VERB"}:
            add_score(boundaries, index, "noBreakScore", 5.0, "subject-predicate", previous.dep_)
        if previous.lemma_ in {"be", "become", "seem", "look", "feel", "remain"} and next_token.pos_ in {
            "ADJ",
            "ADV",
            "DET",
            "NOUN",
            "PRON",
            "PROPN",
            "SCONJ",
        }:
            add_score(boundaries, index, "noBreakScore", 2.9, "copula-complement", previous.lemma_)
        if next_token.dep_ in {"aux", "auxpass", "neg", "prt"}:
            add_score(boundaries, index, "noBreakScore", 2.2, "dependency", next_token.dep_)
        if previous.pos_ == "ADJ" and next_token.dep_ in {"prep", "agent"}:
            add_score(boundaries, index, "noBreakScore", 3.0, "adjective-complement", next_token.dep_)
        if previous.pos_ in {"NOUN", "PROPN", "PRON"} and next_token.dep_ in {"prep", "agent"}:
            add_score(boundaries, index, "noBreakScore", 3.4, "nominal-pp-complement", next_token.dep_)
        if next_token.dep_ in {"det", "poss"}:
            add_score(boundaries, index, "noBreakScore", 2.7, "dependency", f"next-{next_token.dep_}")
        if next_token.dep_ in {"amod", "advmod"}:
            add_score(boundaries, index, "noBreakScore", 1.8, "dependency", f"next-{next_token.dep_}")
        if next_core in CLAUSE_STARTERS:
            add_score(boundaries, index, "breakScore", 1.4, "clause-starter", next_core)
        if next_token.pos_ == "CCONJ" or previous.pos_ == "SCONJ":
            add_score(boundaries, index, "breakScore", 1.2, "conjunction", next_core or previous_core)


def analyze_line(nlp, line):
    text = str(line.get("text") or "")
    ws_tokens = whitespace_tokens(text)
    boundaries = [
        {
            "index": index,
            "breakScore": 0.0,
            "noBreakScore": 0.0,
            "sources": [],
            "labels": [],
            "depth": None,
        }
        for index in range(max(0, len(ws_tokens) - 1))
    ]
    if len(ws_tokens) < 2:
        return {
            "id": line.get("id"),
            "tokenCount": len(ws_tokens),
            "tokens": ws_tokens,
            "spans": [],
            "boundaries": boundaries,
        }

    doc = nlp(text)
    mapping, word_to_tokens = token_word_map(doc, ws_tokens)
    spans = constituent_spans(doc, mapping)
    apply_constituency(boundaries, spans, len(ws_tokens))
    apply_dependency(boundaries, ws_tokens, word_to_tokens)

    tokens = []
    for index, token in enumerate(ws_tokens):
        mapped = word_to_tokens[index]
        primary = mapped[-1] if mapped else None
        tokens.append(
            {
                "text": token["text"],
                "core": token["core"],
                "pos": primary.pos_ if primary else "",
                "tag": primary.tag_ if primary else "",
                "dep": primary.dep_ if primary else "",
                "lemma": primary.lemma_ if primary else token["core"],
            }
        )

    for boundary in boundaries:
        boundary["breakScore"] = round(boundary["breakScore"], 3)
        boundary["noBreakScore"] = round(boundary["noBreakScore"], 3)
        boundary["clean"] = boundary["breakScore"] >= 1.2 and boundary["breakScore"] >= boundary["noBreakScore"] - 0.4
        boundary["tight"] = boundary["noBreakScore"] >= 2.6 and boundary["noBreakScore"] > boundary["breakScore"] + 0.8

    return {
        "id": line.get("id"),
        "tokenCount": len(ws_tokens),
        "tokens": tokens,
        "spans": spans,
        "boundaries": boundaries,
    }


def load_pipeline():
    import benepar
    import spacy

    nlp = spacy.load("en_core_web_sm")
    if "benepar" not in nlp.pipe_names:
        nlp.add_pipe("benepar", config={"model": "benepar_en3_large"})
    return nlp


def main():
    payload = json.load(sys.stdin)
    lines = payload.get("lines") if isinstance(payload, dict) else []
    nlp = load_pipeline()
    result = [analyze_line(nlp, line) for line in lines if isinstance(line, dict)]
    json.dump({"ok": True, "engine": "spacy+benepar_en3_large", "lines": result}, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
