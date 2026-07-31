import type { Course } from "@/content/types";

export const rag: Course = {
  id: "rag",
  title: "RAG & Vector Search",
  tagline: "Grounding models in your own documents",
  description:
    "Retrieval-Augmented Generation end to end: chunking strategy, embedding and indexing, hybrid retrieval, reranking, and how to evaluate a pipeline instead of guessing at it.",
  difficulty: "intermediate",
  glyph: "🔍",
  gradient: "from-violet-500 to-fuchsia-600",
  lessons: [
    {
      id: "why-rag",
      title: "Why RAG Exists",
      summary: "The three problems retrieval solves that fine-tuning doesn't.",
      minutes: 8,
      blocks: [
        {
          type: "text",
          body: "A model's weights are frozen at training time. They don't contain your internal wiki, last week's incident report, or the customer record you need right now. **Retrieval-Augmented Generation** fixes this by fetching relevant text at query time and putting it directly in the prompt.",
        },
        {
          type: "heading",
          text: "What RAG buys you",
        },
        {
          type: "text",
          body: "- **Freshness.** Update a document and the next query sees the change. No retraining.\n- **Attribution.** You know which chunks were retrieved, so you can cite sources and let users verify claims.\n- **Access control.** Filter the retrieval step by user permissions, and the model never sees documents that user isn't allowed to read.",
        },
        {
          type: "callout",
          tone: "key",
          title: "RAG vs. fine-tuning",
          body: "RAG teaches a model new *facts*. Fine-tuning teaches it new *behaviour* — a format, a tone, a task convention. If your problem is 'it doesn't know our product', reach for RAG. If it's 'it won't answer in our house style', consider fine-tuning. They compose well.",
        },
        {
          type: "lab",
          lab: "rag-pipeline",
          title: "Interactive RAG pipeline",
          body: "Run a query through a working retrieval pipeline. Watch chunks get scored and ranked, adjust how many are retrieved, and see exactly what would be assembled into the final prompt.",
        },
        {
          type: "quiz",
          question:
            "A support bot must answer from a knowledge base that changes several times a day. What's the right architecture?",
          options: [
            {
              text: "Fine-tune the model nightly on the latest knowledge base.",
              correct: false,
              explanation:
                "Expensive, slow, and still stale by up to a day. Worse, fine-tuning gives you no way to cite which document an answer came from.",
            },
            {
              text: "RAG — index the knowledge base and retrieve relevant passages per query.",
              correct: true,
              explanation:
                "Correct. Re-indexing a changed document takes seconds, answers stay current, and you get citations for free. This is the canonical RAG use case.",
            },
            {
              text: "Paste the entire knowledge base into the system prompt.",
              correct: false,
              explanation:
                "This can work for a genuinely small corpus, and long context windows make it more viable than it used to be. But it doesn't scale, costs a lot per call, and retrieval quality actually degrades when relevant text is buried in irrelevant text.",
            },
          ],
        },
      ],
    },
    {
      id: "chunking",
      title: "Chunking: The Underrated Decision",
      summary: "How you split documents sets the ceiling on retrieval quality.",
      minutes: 11,
      blocks: [
        {
          type: "text",
          body: "You can't embed a 200-page PDF as one vector — the meaning gets averaged into mush. So you split it into **chunks**. This decision constrains everything downstream: a chunk is the smallest unit that can ever be retrieved, so if the answer spans two chunks, the model may never see it whole.",
        },
        {
          type: "heading",
          text: "The size trade-off",
        },
        {
          type: "text",
          body: "- **Too small** (a sentence): high precision, but the chunk lacks the surrounding context needed to be useful. A retrieved line reading *\"This limit does not apply to enterprise accounts\"* is useless without knowing which limit.\n- **Too large** (a whole chapter): plenty of context, but the embedding blurs across many topics, so it matches everything weakly and nothing strongly.\n- **A common starting point** is 300–800 tokens with 10–20% overlap between adjacent chunks, so a sentence near a boundary appears in both.",
        },
        {
          type: "code",
          lang: "python",
          caption: "Recursive splitting that respects document structure",
          body: `def chunk_text(text: str, size: int = 500, overlap: int = 75) -> list[str]:
    """Split on the largest natural boundary that fits, falling back
    progressively. Keeps paragraphs intact where possible."""
    separators = ["\\n\\n", "\\n", ". ", " "]

    def split(text: str, seps: list[str]) -> list[str]:
        if len(text) <= size or not seps:
            return [text]

        sep, rest = seps[0], seps[1:]
        chunks, current = [], ""

        for part in text.split(sep):
            candidate = current + sep + part if current else part
            if len(candidate) <= size:
                current = candidate
            else:
                if current:
                    chunks.append(current)
                current = part if len(part) <= size else ""
                if len(part) > size:
                    chunks.extend(split(part, rest))

        if current:
            chunks.append(current)
        return chunks

    chunks = split(text, separators)

    # Add overlap so boundary sentences appear in both neighbours
    return [
        (chunks[i - 1][-overlap:] + " " + c) if i > 0 else c
        for i, c in enumerate(chunks)
    ]`,
        },
        {
          type: "callout",
          tone: "info",
          title: "Structure beats character counts",
          body: "Splitting on markdown headings, function definitions, or table rows almost always outperforms a fixed character window. Your documents already encode semantic boundaries — use them instead of ignoring them.",
        },
        {
          type: "callout",
          tone: "warn",
          title: "Keep the metadata",
          body: "Store the source document, section heading, and page number alongside every chunk. You need them for citations, for permission filtering, and for debugging why a bad chunk got retrieved.",
        },
        {
          type: "quiz",
          question:
            "Users ask questions whose answers span several paragraphs, and your bot keeps returning half-answers. Chunks are currently 150 tokens with no overlap. What's the best first fix?",
          options: [
            {
              text: "Retrieve more chunks — bump top-k from 3 to 30.",
              correct: false,
              explanation:
                "A blunt instrument. It floods the context with mostly-irrelevant text, raises cost, and can actually hurt accuracy as the real answer gets buried among near-misses.",
            },
            {
              text: "Increase chunk size and add overlap so complete thoughts survive splitting.",
              correct: true,
              explanation:
                "Correct — the symptom points directly at chunks that are too small to contain a whole answer. Moving to ~500 tokens with 10–20% overlap addresses the root cause rather than compensating downstream.",
            },
            {
              text: "Switch to a larger embedding model.",
              correct: false,
              explanation:
                "A better embedding model improves ranking among chunks, but it can't retrieve information that no single chunk contains. The problem is upstream of embedding quality.",
            },
          ],
        },
      ],
    },
    {
      id: "retrieval",
      title: "Retrieval: Dense, Sparse, and Hybrid",
      summary: "Why the best pipelines run two searches, not one.",
      minutes: 12,
      blocks: [
        {
          type: "text",
          body: "There are two families of retrieval, and they fail in opposite directions — which is exactly why combining them works so well.",
        },
        {
          type: "heading",
          text: "Dense retrieval (embeddings)",
        },
        {
          type: "text",
          body: "Embed the query, find the nearest chunk vectors. **Strength:** handles paraphrase — *\"can't log in\"* matches *\"authentication failure\"*. **Weakness:** exact identifiers. Error code `ERR_4021`, a SKU, or a rare surname may embed to something generic, and the exact-match chunk gets outranked by a vaguely related one.",
        },
        {
          type: "heading",
          text: "Sparse retrieval (BM25)",
        },
        {
          type: "text",
          body: "Classic keyword scoring, weighting rare terms higher. **Strength:** precise on exact tokens — codes, names, jargon. **Weakness:** zero understanding of synonyms. If the user's words don't appear in the document, it scores nothing.",
        },
        {
          type: "callout",
          tone: "key",
          title: "Hybrid search",
          body: "Run both, then fuse the ranked lists — Reciprocal Rank Fusion is the usual choice because it needs no score calibration between the two systems. Hybrid reliably beats either method alone across a wide range of corpora.",
        },
        {
          type: "code",
          lang: "python",
          caption: "Reciprocal Rank Fusion",
          body: `def reciprocal_rank_fusion(rankings: list[list[str]], k: int = 60):
    """Merge ranked ID lists from several retrievers.

    Each list contributes 1/(k + rank) per document. Because only RANK
    matters — never the raw score — you can fuse a cosine-similarity
    retriever with a BM25 retriever without normalizing anything.
    """
    scores: dict[str, float] = {}

    for ranking in rankings:
        for rank, doc_id in enumerate(ranking, start=1):
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank)

    return sorted(scores, key=scores.get, reverse=True)


fused = reciprocal_rank_fusion([
    dense_search(query, top_k=20),
    bm25_search(query, top_k=20),
])`,
        },
        {
          type: "heading",
          text: "Reranking",
        },
        {
          type: "text",
          body: "Retrieval optimizes for speed across millions of documents, so it uses a coarse similarity measure. A **reranker** is a slower, more accurate model that scores the query against each candidate *jointly* rather than comparing pre-computed vectors. The standard pattern: retrieve 50 candidates cheaply, rerank them, keep the top 5.",
        },
        {
          type: "quiz",
          question:
            "Users searching for the exact error code 'ERR_4021' get topically-related pages but never the page documenting that specific code. What fixes this?",
          options: [
            {
              text: "Add keyword (BM25) retrieval alongside the embedding search and fuse the results.",
              correct: true,
              explanation:
                "Exactly the failure dense retrieval is known for. Rare literal strings carry little semantic signal, so they embed near-generically — but BM25 weights rare terms heavily and will surface the exact page immediately.",
            },
            {
              text: "Lower the similarity threshold so more chunks qualify.",
              correct: false,
              explanation:
                "This returns more of the same weakly-related chunks. The correct page isn't being filtered out by a threshold — it was never ranked highly in the first place.",
            },
            {
              text: "Re-embed the corpus with a higher-dimensional model.",
              correct: false,
              explanation:
                "More dimensions won't create semantic signal that an opaque identifier doesn't have. This is a structural limitation of dense retrieval, not a capacity problem.",
            },
          ],
        },
      ],
    },
    {
      id: "evaluating-rag",
      title: "Evaluating a RAG System",
      summary: "Measure retrieval and generation separately, or you'll debug blind.",
      minutes: 10,
      blocks: [
        {
          type: "text",
          body: "When a RAG answer is wrong, there are exactly two suspects: retrieval didn't find the right chunk, or generation had it and answered badly anyway. **Measure them separately** — a single end-to-end score can't tell you which half to fix.",
        },
        {
          type: "heading",
          text: "Retrieval metrics",
        },
        {
          type: "text",
          body: "- **Recall@k** — of the queries with a known correct document, how often does it appear in the top `k`? This is your ceiling: if the right chunk isn't retrieved, no amount of prompt engineering saves the answer.\n- **MRR (Mean Reciprocal Rank)** — how high up the list the correct chunk lands. Position matters, because models attend more reliably to material near the start of the retrieved set.",
        },
        {
          type: "heading",
          text: "Generation metrics",
        },
        {
          type: "text",
          body: "- **Faithfulness** — is every claim in the answer supported by the retrieved chunks? This is the direct measure of hallucination in a RAG setting.\n- **Answer relevance** — does the response actually address what was asked, rather than summarizing whatever got retrieved?\n- **Citation accuracy** — do the cited sources genuinely contain the claims attributed to them?",
        },
        {
          type: "callout",
          tone: "info",
          title: "Build the eval set first",
          body: "Fifty real question/answer pairs with known source documents will teach you more than any amount of intuition. Write them before you start tuning — otherwise every change is a guess and you can't tell improvement from noise.",
        },
        {
          type: "code",
          lang: "python",
          caption: "Recall@k over a labelled eval set",
          body: `def recall_at_k(eval_set, retriever, k: int = 5) -> float:
    """eval_set: list of {"query": str, "relevant_doc_ids": set[str]}"""
    hits = 0

    for example in eval_set:
        retrieved = set(retriever(example["query"], top_k=k))
        # Credit the query if ANY known-relevant doc made the cut
        if retrieved & example["relevant_doc_ids"]:
            hits += 1

    return hits / len(eval_set)


for k in (1, 3, 5, 10, 20):
    print(f"Recall@{k}: {recall_at_k(eval_set, hybrid_search, k):.1%}")`,
        },
        {
          type: "callout",
          tone: "key",
          title: "Debug in the right order",
          body: "Check Recall@k first. If the correct chunk never gets retrieved, fixing your prompt is wasted effort — the model is being asked to answer from material it was never given.",
        },
        {
          type: "quiz",
          question:
            "Recall@5 is 94%, but users still report wrong answers. Where should you look?",
          options: [
            {
              text: "Retrieval — 94% still means failures, so chase the last 6%.",
              correct: false,
              explanation:
                "94% recall is strong. If wrong answers are common, they can't all be explained by that remaining 6% — the correct chunk is usually present when the answer is bad.",
            },
            {
              text: "Generation — the right context is being retrieved but the model isn't using it faithfully.",
              correct: true,
              explanation:
                "Correct. High recall with low answer quality isolates the problem to the generation step. Investigate faithfulness: is the model overriding retrieved context with its own priors, is the context ordered poorly, or does the prompt fail to instruct it to answer only from the provided material?",
            },
            {
              text: "Chunk size — increase it and re-index.",
              correct: false,
              explanation:
                "Possible, but you'd be changing an input without evidence pointing there. Measure faithfulness first; chunking changes force a full re-index and shouldn't be a blind guess.",
            },
          ],
        },
      ],
    },
  ],
};
