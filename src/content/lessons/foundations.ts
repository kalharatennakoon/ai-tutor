import type { Course } from "@/content/types";

export const foundations: Course = {
  id: "foundations",
  title: "LLM Foundations",
  tagline: "How large language models actually work",
  description:
    "Start here. Build an accurate mental model of what a language model is doing when it answers you — tokens, embeddings, probability distributions, and the sampling knobs you control.",
  difficulty: "beginner",
  glyph: "🧠",
  gradient: "from-sky-500 to-indigo-600",
  lessons: [
    {
      id: "what-is-an-llm",
      title: "What an LLM Really Is",
      summary: "A next-token predictor, and why that framing explains almost everything.",
      minutes: 8,
      blocks: [
        {
          type: "text",
          body: "A large language model is a function. You hand it a sequence of text, and it returns a **probability distribution over what comes next**. That's the entire core operation. Everything else — chat, code generation, summarization, agents — is built on top of repeating that one step.",
        },
        {
          type: "text",
          body: "When you ask a model *\"The capital of France is\"*, it doesn't look up a fact in a database. It computes that `\" Paris\"` is overwhelmingly the most likely continuation, given the patterns in its training data. Then it appends that token to the input and runs again. And again. This loop is called **autoregressive generation**.",
        },
        {
          type: "callout",
          tone: "key",
          title: "The one-sentence version",
          body: "A model predicts one token at a time, feeding each prediction back in as input. Fluency, reasoning, and hallucination are all downstream of that.",
        },
        {
          type: "code",
          lang: "python",
          caption: "Autoregressive generation, stripped to its skeleton",
          body: `tokens = tokenize("The capital of France is")

for _ in range(max_new_tokens):
    logits = model(tokens)          # scores for every token in the vocabulary
    probs  = softmax(logits[-1])    # only the LAST position matters
    next_token = sample(probs)      # pick one — see the sampling lesson
    tokens.append(next_token)

    if next_token == END_OF_TEXT:
        break

return detokenize(tokens)`,
        },
        {
          type: "text",
          body: "Three consequences fall directly out of this design, and they explain most of the surprising behaviour people run into:",
        },
        {
          type: "text",
          body: "- **Models have no memory between calls.** The API is stateless. If a chat app seems to remember you, it's because the whole conversation is being re-sent on every request.\n- **Models can be confidently wrong.** A plausible-sounding token is a *likely* token. Likelihood is not truth, so fabrication is the same mechanism as correctness — just pointed at something the model doesn't know.\n- **Thinking out loud helps.** Each generated token is extra input for the next step, so writing intermediate reasoning gives the model more compute to work with before it commits to an answer.",
        },
        {
          type: "quiz",
          question:
            "A model answers a question about a niche API and invents a method that doesn't exist. What is the most accurate explanation?",
          options: [
            {
              text: "The model retrieved the wrong entry from its internal database.",
              correct: false,
              explanation:
                "There is no internal database to retrieve from. Weights encode statistical patterns, not indexed records — which is exactly why the failure looks like fluent invention rather than a lookup error.",
            },
            {
              text: "The invented method was a statistically plausible continuation, and plausibility is not the same as accuracy.",
              correct: true,
              explanation:
                "Exactly. The model generated the most likely-looking token sequence given its training patterns. It has no separate 'is this true?' check — which is the core motivation for RAG and tool use.",
            },
            {
              text: "The model ran out of context and started guessing.",
              correct: false,
              explanation:
                "Context exhaustion causes truncation or forgetting earlier turns, not fabrication. This answer would have been produced with plenty of context to spare.",
            },
          ],
        },
        {
          type: "callout",
          tone: "info",
          title: "Where this is heading",
          body: "If plausibility drives generation, then grounding the model in real documents should reduce fabrication. That intuition is the whole basis of the RAG course.",
        },
      ],
    },
    {
      id: "tokens",
      title: "Tokens: The Model's Alphabet",
      summary: "Why models see word fragments, not characters — and what that breaks.",
      minutes: 10,
      blocks: [
        {
          type: "text",
          body: "Models don't read characters and they don't read words. They read **tokens**: subword chunks produced by a tokenizer that was trained to compress the text it saw most often. Common words become one token. Rare words get split into pieces.",
        },
        {
          type: "text",
          body: "This matters practically, because tokens are the unit of billing, the unit of the context window, and the unit of the rate limit. A prompt's cost is measured in tokens, not words.",
        },
        {
          type: "lab",
          lab: "tokenizer",
          title: "Tokenizer playground",
          body: "Type anything below to see it split into tokens. Try a common English sentence, then a long chemical name, then a string of emoji — watch the tokens-per-character ratio swing wildly.",
        },
        {
          type: "callout",
          tone: "warn",
          title: "This lab is an approximation",
          body: "It uses a simplified BPE-style splitter so it can run in your browser with no model download. Real tokenizers differ per model family. For exact counts, call a token-counting endpoint.",
        },
        {
          type: "heading",
          text: "The classic failure modes",
        },
        {
          type: "text",
          body: "Once you know models see tokens, a whole category of weird behaviour stops being mysterious:",
        },
        {
          type: "text",
          body: "- **Counting letters.** Asking how many `r`s are in *strawberry* is hard because the model may see `straw` + `berry`, not ten characters. The letters aren't individually visible.\n- **Reversing strings.** Same reason. Character-level operations fight the representation.\n- **Non-English costs more.** Languages under-represented in tokenizer training get split into more, smaller tokens — so the same meaning costs more tokens and eats more context.\n- **Arithmetic on long numbers.** `1234567` may split in ways that don't align with digit places.",
        },
        {
          type: "callout",
          tone: "key",
          title: "Rule of thumb",
          body: "For typical English prose, 1 token ≈ 4 characters ≈ 0.75 words. Code and non-English text are denser — budget more.",
        },
        {
          type: "quiz",
          question:
            "You're building a chat app and want to keep costs down. Which change has the largest effect on token spend for a long-running conversation?",
          options: [
            {
              text: "Shortening variable names in the code that calls the API.",
              correct: false,
              explanation:
                "Your source code is never sent to the model. Only the prompt content — system prompt, conversation history, and documents — counts toward tokens.",
            },
            {
              text: "Trimming or summarizing older conversation turns before re-sending them.",
              correct: true,
              explanation:
                "Right. Because the API is stateless, the entire history is re-sent every turn — so history grows quadratically in cost over a long conversation. Trimming, summarizing, or caching that prefix is the biggest lever you have.",
            },
            {
              text: "Asking the model to reply more politely.",
              correct: false,
              explanation:
                "Tone has a marginal effect on output length at best. The dominant cost in a long chat is re-sending accumulated history as input on every single turn.",
            },
          ],
        },
      ],
    },
    {
      id: "embeddings",
      title: "Embeddings and Meaning as Geometry",
      summary: "Turning text into vectors so that 'similar' becomes 'nearby'.",
      minutes: 12,
      blocks: [
        {
          type: "text",
          body: "An **embedding** is a list of numbers representing a piece of text, produced so that texts with similar meanings land close together in the vector space. This is the trick that makes semantic search possible: instead of matching keywords, you match *positions*.",
        },
        {
          type: "text",
          body: "Real embeddings have hundreds or thousands of dimensions. The lab below squashes that down to two so you can actually see it — the intuition transfers directly.",
        },
        {
          type: "lab",
          lab: "embeddings",
          title: "Vector similarity explorer",
          body: "Drag the query point around the space. Watch which documents rank highest as you move, and notice how cosine similarity cares about *direction* while Euclidean distance cares about *position*.",
        },
        {
          type: "heading",
          text: "Cosine similarity",
        },
        {
          type: "text",
          body: "The standard way to compare two embeddings is **cosine similarity**: the cosine of the angle between them. It ranges from `-1` (opposite) through `0` (unrelated) to `1` (identical direction). Because it ignores vector length, a short document and a long document about the same topic still score as similar.",
        },
        {
          type: "code",
          lang: "python",
          caption: "Cosine similarity from scratch",
          body: `import numpy as np

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

# If your vectors are already unit-normalized (most embedding APIs
# return them that way), the dot product IS the cosine similarity —
# which is why vector databases can search so fast.
def cosine_normalized(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b))`,
        },
        {
          type: "callout",
          tone: "info",
          title: "Embedding models are not chat models",
          body: "They're separate, smaller, cheaper models that output a vector instead of text. You'll typically use one embedding model for a whole corpus — and if you switch models, you must re-embed everything, because vectors from different models aren't comparable.",
        },
        {
          type: "quiz",
          question:
            "You embed 'How do I reset my password?' and 'I forgot my login credentials.' They share almost no words. What should you expect?",
          options: [
            {
              text: "Low similarity — embeddings ultimately reduce to keyword overlap.",
              correct: false,
              explanation:
                "That describes lexical search (BM25, TF-IDF). Embeddings are trained specifically so that paraphrases without shared vocabulary still land close together.",
            },
            {
              text: "High similarity, because they express the same underlying intent.",
              correct: true,
              explanation:
                "Correct — and this is precisely why semantic search beats keyword search for support and FAQ retrieval, where users rarely phrase things the way your docs do.",
            },
            {
              text: "Undefined — you can't compare embeddings of different lengths.",
              correct: false,
              explanation:
                "Every text embedded by a given model produces a vector of the same fixed dimensionality, regardless of input length. That's what makes them directly comparable.",
            },
          ],
        },
      ],
    },
    {
      id: "sampling",
      title: "Sampling: Temperature and Top-p",
      summary: "How a probability distribution becomes one concrete token.",
      minutes: 9,
      blocks: [
        {
          type: "text",
          body: "The model gives you a distribution over the whole vocabulary. **Sampling** is the step that turns that distribution into a single chosen token — and it's the part you get direct control over.",
        },
        {
          type: "lab",
          lab: "temperature",
          title: "Temperature & top-p sandbox",
          body: "Adjust the sliders to reshape a fixed probability distribution. Push temperature toward 0 and watch it collapse onto one token; push it up and watch the tail come alive.",
        },
        {
          type: "heading",
          text: "The knobs",
        },
        {
          type: "text",
          body: "- **Temperature** rescales the logits before the softmax. Below `1.0` it sharpens the distribution (more deterministic, more repetitive); above `1.0` it flattens it (more varied, more likely to go off the rails). At `0` you get greedy decoding — always the single most likely token.\n- **Top-p (nucleus sampling)** keeps only the smallest set of tokens whose probabilities sum to `p`, then renormalizes. It adapts to context: when the model is confident, the nucleus is tiny; when it's uncertain, more options survive.\n- **Top-k** keeps a fixed number of candidates. Simpler, but blunter than top-p because `k` doesn't adapt to how confident the model is.",
        },
        {
          type: "callout",
          tone: "warn",
          title: "Temperature 0 is not 'truth mode'",
          body: "Low temperature makes output more *repeatable*, not more *correct*. A confidently wrong model at temperature 0 will give you the same wrong answer every time — reliably.",
        },
        {
          type: "callout",
          tone: "info",
          title: "Newer models may not expose these",
          body: "Some current frontier models drop temperature/top-p entirely in favour of a reasoning-effort setting, and reject sampling parameters outright. Always check the parameter reference for the model you're actually calling.",
        },
        {
          type: "quiz",
          question:
            "You're extracting structured JSON fields from invoices and need consistent output. What's the best starting configuration?",
          options: [
            {
              text: "High temperature, so the model considers more possible readings.",
              correct: false,
              explanation:
                "Extraction wants determinism, not exploration. High temperature adds variance to a task where every run should ideally produce the same fields.",
            },
            {
              text: "Low temperature (or greedy decoding), plus a schema constraint on the output.",
              correct: true,
              explanation:
                "Right on both counts. Low temperature reduces run-to-run variance, and a structured-output schema guarantees the shape is parseable rather than merely likely to be.",
            },
            {
              text: "Default temperature, and retry until the JSON parses.",
              correct: false,
              explanation:
                "This works but wastes tokens and latency on avoidable retries. Constrain the output format directly instead of sampling until you get lucky.",
            },
          ],
        },
      ],
    },
  ],
};
