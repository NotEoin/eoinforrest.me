import { useCallback, useMemo, useState } from 'react';
import DemoFrame, { Toggle } from '../components/DemoFrame';

/**
 * HalRagDemo — ask a small vault, get cited answers.
 *
 * Real cosine ranking over a tiny hand-authored embedding table (keyword
 * dimensions), pre-written answers per question, and the honest refusal when
 * the notes don't cover it. The "skip stubs" toggle demonstrates the project's
 * biggest quality finding: index the dashboards and a note that mentions every
 * topic wins the ranking while containing nothing.
 *
 * The corpus is synthetic. No real vault content ships to the browser.
 */

const DIMS = ['context', 'retrieval', 'gpu', 'voice', 'latency', 'vault', 'index', 'model'] as const;
type Vec = Record<typeof DIMS[number], number>;
const v = (o: Partial<Vec>): Vec =>
  DIMS.reduce((a, d) => ({ ...a, [d]: o[d] ?? 0 }), {} as Vec);

interface Note {
  title: string; kind: 'note' | 'stub' | 'dashboard';
  text: string; vec: Vec;
}

const VAULT: Note[] = [
  { title: 'Context budgets', kind: 'note', vec: v({ context: 1, retrieval: .5, model: .4 }),
    text: 'A 32K window is shared between input and output, so everything loaded as background is context the work does not get. The design question is always: what is the least context that makes this answer good?' },
  { title: 'Three-tier memory', kind: 'note', vec: v({ context: .7, vault: .8, index: .3 }),
    text: 'Durable facts live in a capped CLAUDE.md that archives itself past roughly 280 lines. Sessions are stored as summaries rather than transcripts, and resume loads three logs by default.' },
  { title: 'Retrieval over stuffing', kind: 'note', vec: v({ retrieval: 1, index: .6, vault: .5 }),
    text: 'The vault is embedded and only the closest passages are retrieved. The model is constrained to answer from those passages, citing each as a wikilink, or to say plainly that the notes do not cover it.' },
  { title: 'Skip the shells', kind: 'note', vec: v({ index: 1, retrieval: .6 }),
    text: 'Indexing everything made results worse. Dashboards and index shells are short and mention every topic, so they score well against almost any query while containing nothing. The indexer skips them.' },
  { title: 'One consumer GPU', kind: 'note', vec: v({ gpu: 1, model: .7 }),
    text: 'Everything runs on 24GB. Qwen3-Coder is the best coding model that fits the budget, and speech-to-text is kept on the CPU so the GPU stays free for the language model and TTS.' },
  { title: 'Voice latency', kind: 'note', vec: v({ voice: 1, latency: 1, model: .4 }),
    text: 'Silence is worse in a voice interface than on screen. The reply is streamed sentence by sentence so audio starts as soon as sentence one is synthesised, while the model is still writing sentence two.' },
  { title: 'Vault hygiene', kind: 'stub', vec: v({ vault: .6, index: .4 }), text: 'TODO' },
  { title: 'Hal — index', kind: 'dashboard',
    vec: v({ context: .55, retrieval: .55, gpu: .55, voice: .55, latency: .55, vault: .55, index: .55, model: .55 }),
    text: 'Links: Context budgets · Three-tier memory · Retrieval over stuffing · One consumer GPU · Voice latency · Vault hygiene' },
];

const QUESTIONS: { q: string; vec: Vec; answer: string; cites: string[] }[] = [
  { q: 'Why is the context window the constraint?',
    vec: v({ context: 1, model: .3 }),
    answer: 'Because the 32K window is shared between input and output, so anything loaded as background is context the actual work does not get — which is why memory is tiered and sessions are stored as summaries rather than transcripts.',
    cites: ['Context budgets', 'Three-tier memory'] },
  { q: 'How does it avoid making things up?',
    vec: v({ retrieval: 1, index: .4 }),
    answer: 'Only the closest passages are retrieved, and the model is constrained to answer from those passages and cite each one — or to say plainly that the notes do not cover the question.',
    cites: ['Retrieval over stuffing'] },
  { q: 'What made retrieval quality worse?',
    // a deliberately diffuse query — it brushes every topic the way vague
    // questions do, which is exactly when an indexed dashboard wins the ranking
    vec: v({ index: .8, retrieval: .3, context: .3, model: .25, gpu: .3, voice: .25, latency: .25, vault: .35 }),
    answer: 'Indexing everything. Dashboards and index shells mention every topic in a few words, so they rank well against almost any query while containing nothing useful. Skipping them was the single biggest quality improvement, and it was a content decision rather than a model one.',
    cites: ['Skip the shells'] },
  { q: 'Why does speech-to-text run on the CPU?',
    vec: v({ gpu: 1, voice: .6, latency: .4 }),
    answer: 'To keep the whole 24GB GPU free for the language model and the voice synthesiser.',
    cites: ['One consumer GPU', 'Voice latency'] },
];

const cos = (a: Vec, b: Vec) => {
  let dot = 0, na = 0, nb = 0;
  for (const d of DIMS) { dot += a[d] * b[d]; na += a[d] ** 2; nb += b[d] ** 2; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
};

export default function HalRagDemo() {
  const TINT = 'oklch(0.88 0.04 88)';
  const [skipStubs, setSkipStubs] = useState<0 | 1>(0);   // 0 = skip, 1 = index everything
  const [asked, setAsked] = useState(QUESTIONS[0]);
  const [free, setFree] = useState('');
  const [freeMode, setFreeMode] = useState(false);

  const corpus = useMemo(
    () => (skipStubs === 0 ? VAULT.filter(n => n.kind === 'note') : VAULT),
    [skipStubs]
  );

  const ranked = useMemo(() => {
    const query = freeMode ? v({}) : asked.vec;
    return corpus
      .map(n => ({ note: n, score: cos(query, n.vec) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [corpus, asked, freeMode]);

  const polluted = ranked[0]?.note.kind !== 'note';
  const grounded = !freeMode && !polluted;

  const reset = useCallback(() => { setAsked(QUESTIONS[0]); setFree(''); setFreeMode(false); setSkipStubs(0); }, []);

  return (
    <DemoFrame
      title="Hal — grounded retrieval over a small vault"
      tint={TINT}
      explains="Ten short synthetic notes stand in for the vault. Your question is embedded, the closest passages are retrieved by cosine similarity, and the answer is built only from those passages, citing each as an Obsidian wikilink. Ask something the notes do not cover and it says so. Switch to 'index everything' and watch a dashboard note that mentions every topic win the ranking — the project's biggest quality finding, in one click."
      alternative="An interactive reconstruction of Hal's retrieval-augmented answering: a question is matched against a small synthetic note collection by cosine similarity, the top passages are shown with their scores, and the answer cites each passage as an Obsidian wikilink or refuses when the notes do not cover the question. A toggle shows how indexing dashboards and stubs degrades the ranking."
      readout={{
        'chunks indexed': corpus.length,
        'top-k': 3,
        'best score': ranked[0] ? ranked[0].score.toFixed(2) : '0.00',
        grounded: grounded ? 'yes' : 'no',
      }}
      onReset={reset}
      toolbar={
        <Toggle label="indexer" options={['Skip stubs', 'Index everything']} value={skipStubs} onChange={setSkipStubs} />
      }
    >
      <div className="absolute inset-0 grid grid-cols-1 gap-4 overflow-auto p-4 pb-20 md:grid-cols-3">
        {/* vault */}
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[.12em] text-[var(--text-lo)]">// vault</p>
          <ul className="space-y-1 font-mono text-[11px]">
            {VAULT.map(n => {
              const included = corpus.includes(n);
              return (
                <li key={n.title}
                    className={included ? 'text-[var(--text-md)]' : 'text-[var(--text-lo)] line-through'}>
                  {n.title}
                  {n.kind !== 'note' && <span className="ml-1 text-[var(--text-lo)]">[{n.kind}]</span>}
                </li>
              );
            })}
          </ul>
        </div>

        {/* retrieved */}
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[.12em] text-[var(--text-lo)]">// retrieved</p>
          <ul className="space-y-2">
            {ranked.map(({ note, score }) => (
              <li key={note.title} className="rounded-[10px] border border-[var(--line)] p-2">
                <p className="flex justify-between font-mono text-[11px]">
                  <span className="text-[var(--text-hi)]">[[{note.title}]]</span>
                  <span className="tabular-nums text-[var(--text-lo)]">{score.toFixed(2)}</span>
                </p>
                <p className="mt-1 line-clamp-3 text-[12px] leading-relaxed text-[var(--text-md)]">{note.text}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* answer */}
        <div className="flex min-h-0 flex-col">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[.12em] text-[var(--text-lo)]">// answer</p>
          <div className="flex-1 text-[13px] leading-relaxed text-[var(--text-md)]">
            {freeMode ? (
              <p>The notes don't cover that.</p>
            ) : polluted ? (
              <p>
                {ranked[0].note.kind === 'dashboard'
                  ? 'The closest match is an index page that lists topics without explaining any of them, so there is nothing here to answer from.'
                  : 'The closest match is an empty stub, so there is nothing here to answer from.'}
              </p>
            ) : (
              <>
                <p>{asked.answer}</p>
                <p className="mt-2 font-mono text-[11px] text-[var(--text-lo)]">
                  {asked.cites.map(c => `[[${c}]]`).join(' · ')}
                </p>
              </>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {QUESTIONS.map(q => (
              <button key={q.q} type="button"
                onClick={() => { setAsked(q); setFreeMode(false); }}
                aria-pressed={!freeMode && asked.q === q.q}
                className={`rounded-full border px-2.5 py-1 text-left font-mono text-[10px] transition-colors
                  ${!freeMode && asked.q === q.q
                    ? 'border-[var(--tint)] text-[var(--text-hi)]'
                    : 'border-[var(--line-2)] text-[var(--text-md)] hover:text-[var(--text-hi)]'}`}>
                {q.q}
              </button>
            ))}
          </div>

          <form className="mt-2 flex gap-2"
                onSubmit={e => { e.preventDefault(); setFreeMode(free.trim().length > 0); }}>
            <input value={free} onChange={e => setFree(e.target.value)}
              placeholder="ask something else"
              aria-label="Ask the vault a question"
              className="min-w-0 flex-1 rounded-full border border-[var(--line-2)] bg-transparent px-3 py-1.5
                         font-mono text-[11px] text-[var(--text-hi)] placeholder:text-[var(--text-lo)]
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                         focus-visible:outline-[var(--accent)]" />
            <button type="submit"
              className="rounded-full border border-[var(--line-2)] px-3 py-1.5 font-mono text-[10px]
                         uppercase tracking-[.12em] text-[var(--text-md)] hover:text-[var(--text-hi)]">
              Ask
            </button>
          </form>
        </div>
      </div>
    </DemoFrame>
  );
}
