import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ExternalLink, Search, X } from "lucide-react";
import CircuitPanel from "./CircuitPanel";
import { useJson } from "./data";
import FeatureCard from "./FeatureCard";
import { BudgetSummary, FeatureList } from "./FeatureList";
import { prob, tokenText } from "./format";
import { TextNeighbors } from "./Neighbors";
import type { App, LanguageIndex, LanguageTarget, Passage, PassageData, RankedFeature } from "./types";
import { Bar, ErrorText, Panel, PanelHeading, Skeleton } from "./ui";
import { useRevealCard } from "./useRevealCard";
import { ListSkeleton } from "./VisionView";
import { defaultTarget, splitWords } from "./words";

export interface LanguageSelection {
  passageId?: string;
  t?: number;
  /** undefined: the top-ranked feature; null: none. */
  featureId?: string | null;
  budget?: number;
}

interface Props {
  app: App;
  sel: LanguageSelection;
  update: (next: Partial<LanguageSelection>) => void;
}

export default function LanguageView({ app, sel, update }: Props) {
  const index = useJson<LanguageIndex>("language/index.json");
  const info = index.data;
  const passageId = sel.passageId ?? info?.passages[0]?.id ?? null;
  const passage = info?.passages.find((p) => p.id === passageId) ?? null;
  const detail = useJson<PassageData>(passageId ? `language/p/${passageId}.json` : null);
  const data = detail.data;
  const t = data ? (sel.t !== undefined && data.targets[sel.t] ? sel.t : defaultTarget(data)) : null;
  const target: LanguageTarget | null = data && t !== null ? data.targets[t] : null;

  const ranked: RankedFeature[] = useMemo(
    () => target?.features.map(([l, f, s], i) => ({ id: `${l}_${f}`, l, f, s, rank: i + 1, deact: target.deact[i] })) ?? [],
    [target],
  );
  const featureId = sel.featureId === undefined ? ranked[0]?.id ?? null : sel.featureId;
  const feature = ranked.find((f) => f.id === featureId) ?? null;
  const budget = sel.budget ?? info?.budgets[1]?.pct ?? info?.budgets[0]?.pct ?? 0;
  const outcome = data && t !== null ? tokenText(data.tokens[t]) : "";
  const { cardRef, reveal } = useRevealCard();

  const select = (id: string) => {
    update({ featureId: id });
    reveal();
  };

  if (index.error) return <ErrorText>Could not load the passages ({index.error}).</ErrorText>;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <Panel label="Search passages">
          {info ? (
            <PassageSearch passages={info.passages} selected={passageId} onSelect={(id) => update({ passageId: id, t: undefined, featureId: undefined })} />
          ) : (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}
        </Panel>
        <Panel label="Passage">
          <PassageReader
            passage={passage}
            data={data}
            error={detail.error}
            selected={t}
            onSelect={(next) => update({ t: next, featureId: undefined })}
          />
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <Panel label="Selected word" className="space-y-6">
          {data && target && t !== null ? (
            <>
              <WordPrediction tokens={data.tokens} t={t} target={target} />
              {app === "attribution" && info && (
                <BudgetSummary budgets={info.budgets} effects={target.setEffect} intact={target.p} outcome={outcome} totalFeatures={info.layers * info.featuresPerLayer} />
              )}
            </>
          ) : detail.error ? null : data ? (
            <p className="text-sm text-[#5c5966]">This passage has no selectable words.</p>
          ) : (
            <ListSkeleton />
          )}
        </Panel>
        <Panel label={app === "attribution" ? "Activation attribution" : "Atlas neighbours"}>
          {target && info ? (
            app === "attribution" ? (
              <FeatureList features={ranked} selectedId={featureId} onSelect={select} outcome={outcome} inputKey={`${passageId}:${t}`} />
            ) : (
              <TextNeighbors neighbors={target.neighbors} atlasSources={info.atlasSources} />
            )
          ) : detail.error ? (
            <ErrorText>Could not load this passage ({detail.error}).</ErrorText>
          ) : data ? null : (
            <ListSkeleton />
          )}
        </Panel>
      </div>

      {app === "circuit" && info && target && (
        <CircuitPanel
          budgets={info.budgets}
          budget={budget}
          onBudget={(pct) => update({ budget: pct })}
          features={ranked}
          layers={info.layers}
          featuresPerLayer={info.featuresPerLayer}
          layerMass={target.layerMass}
          effects={target.setEffect}
          intact={target.p}
          outcome={outcome}
          selectedId={featureId}
          onSelect={select}
        />
      )}
      {app === "circuit" && !target && !detail.error && <Skeleton className="h-80 w-full" />}

      {feature && info && (
        <FeatureCard ref={cardRef} modality="language" feature={feature} featuresPerLayer={info.featuresPerLayer} outcome={outcome} onClose={() => update({ featureId: null })} />
      )}
    </div>
  );
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function highlight(text: string, pattern: RegExp | null): ReactNode {
  if (!pattern) return text;
  return text.split(pattern).map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded-[2px] bg-[#3f21b6]/15 px-[1px] text-[#18161f]">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function snippet(text: string, terms: string[]): string {
  const lower = text.toLowerCase();
  const positions = terms.map((term) => lower.indexOf(term)).filter((i) => i >= 0);
  const at = positions.length ? Math.min(...positions) : 0;
  if (at < 40) return text.slice(0, 140);
  const from = text.lastIndexOf(" ", at - 40);
  return `…${text.slice(from < 0 ? at - 40 : from + 1, at + 100)}`;
}

const SHOWN = 100;

function PassageSearch({ passages, selected, onSelect }: { passages: Passage[]; selected: string | null; onSelect: (id: string) => void }) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setQuery(input), 160);
    return () => clearTimeout(timer);
  }, [input]);

  const haystack = useMemo(() => passages.map((p) => ({ p, title: p.title.toLowerCase(), text: p.text.toLowerCase() })), [passages]);
  const terms = useMemo(() => query.toLowerCase().split(/\s+/).filter(Boolean), [query]);
  const pattern = useMemo(() => (terms.length ? new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi") : null), [terms]);
  const results = useMemo(() => {
    if (!terms.length) return passages;
    return haystack
      .filter(({ title, text }) => terms.every((term) => title.includes(term) || text.includes(term)))
      .map((entry) => ({ entry, titleHits: terms.filter((term) => entry.title.includes(term)).length }))
      .sort((a, b) => b.titleHits - a.titleHits)
      .map(({ entry }) => entry.p);
  }, [haystack, passages, terms]);

  return (
    <div className="flex h-full flex-col">
      <label htmlFor="kpsa-search" className="kpsa-eyebrow mb-3 block">
        Search {passages.length.toLocaleString("en-US")} passages
      </label>
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8794]" />
        <input
          id="kpsa-search"
          type="search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Title or text, e.g. river"
          autoComplete="off"
          spellCheck={false}
          aria-controls="kpsa-results"
          className="kpsa-search h-10 w-full rounded-full border border-[#18161f]/15 bg-white pl-9 pr-9 text-sm text-[#18161f] placeholder:text-[#8a8794] focus:border-[#3f21b6] focus:outline-none focus:ring-2 focus:ring-[#3f21b6]/20"
        />
        {input && (
          <button
            type="button"
            onClick={() => setInput("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#8a8794] hover:text-[#18161f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f21b6]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <p className="mb-1.5 mt-3 text-[0.72rem] text-[#6b6875]" aria-live="polite">
        {terms.length ? `${results.length.toLocaleString("en-US")} ${results.length === 1 ? "match" : "matches"}` : "All passages"}
        {results.length > SHOWN ? `, first ${SHOWN} shown` : ""}
      </p>
      <ul id="kpsa-results" className="kpsa-scroll -mx-2 h-64 overflow-y-auto lg:h-auto lg:min-h-0 lg:flex-1 lg:basis-0">
        {results.slice(0, SHOWN).map((p) => {
          const active = p.id === selected;
          return (
            <li key={p.id}>
              <button
                type="button"
                aria-current={active ? "true" : undefined}
                onClick={() => onSelect(p.id)}
                className={`w-full rounded-md px-2 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3f21b6] ${
                  active ? "bg-[#3f21b6]/[0.08]" : "hover:bg-[#18161f]/[0.035]"
                }`}
              >
                <span className={`block truncate text-sm font-medium ${active ? "text-[#3f21b6]" : "text-[#18161f]"}`}>{highlight(p.title, pattern)}</span>
                <span className="mt-0.5 line-clamp-2 text-xs leading-snug text-[#5c5966]">{highlight(snippet(p.text, terms), pattern)}</span>
              </button>
            </li>
          );
        })}
        {terms.length > 0 && results.length === 0 && <li className="px-2 py-3 text-sm text-[#5c5966]">No passage contains “{query}”.</li>}
      </ul>
    </div>
  );
}

function PassageReader({
  passage,
  data,
  error,
  selected,
  onSelect,
}: {
  passage: Passage | null;
  data: PassageData | null;
  error: string | null;
  selected: number | null;
  onSelect: (t: number) => void;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const words = useMemo(() => (data ? splitWords(data.tokens) : []), [data]);

  // Keep the selected word visible inside the reader without scrolling the page.
  useLayoutEffect(() => {
    const box = scroller.current;
    const word = box?.querySelector<HTMLElement>("[data-selected='true']");
    if (!box || !word) return;
    const top = word.offsetTop - box.offsetTop;
    if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - 32) box.scrollTop = Math.max(0, top - box.clientHeight / 3);
  }, [data, selected]);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="kpsa-eyebrow mb-1">Passage · click a word</p>
          {passage ? <h3 className="font-serif text-[1.35rem] leading-tight text-[#18161f]">{passage.title}</h3> : <Skeleton className="h-6 w-48" />}
        </div>
        {passage && (
          <a href={passage.url} target="_blank" rel="noreferrer" className="kpsa-link mt-5 inline-flex shrink-0 items-center gap-1 text-xs">
            Wikipedia <ExternalLink aria-hidden className="h-3 w-3" />
          </a>
        )}
      </div>
      <div ref={scroller} className="kpsa-scroll relative -mx-1 h-[19rem] overflow-y-auto px-1 sm:h-[21rem]">
        {error ? (
          <ErrorText>Could not load this passage ({error}).</ErrorText>
        ) : data ? (
          <p className="kpsa-reader whitespace-pre-wrap text-[0.98rem] leading-[1.85] text-[#18161f]">
            {words.map((word) => {
              const lead = data.tokens[word.start].match(/^\s*/)?.[0] ?? "";
              const text = data.tokens.slice(word.start, word.end).join("").slice(lead.length);
              const clickable = Boolean(data.targets[word.start]) && text.trim().length > 0;
              const active = word.start === selected;
              return (
                <span key={word.start}>
                  {lead}
                  {clickable ? (
                    <button
                      type="button"
                      data-selected={active}
                      aria-pressed={active}
                      onClick={() => onSelect(word.start)}
                      className={`kpsa-word rounded-[4px] px-[2px] -mx-[2px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3f21b6] ${
                        active ? "bg-[#3f21b6] text-white" : "hover:bg-[#3f21b6]/10 hover:text-[#3f21b6]"
                      }`}
                    >
                      {text}
                    </button>
                  ) : (
                    <span>{text}</span>
                  )}
                </span>
              );
            })}
          </p>
        ) : (
          <div className="space-y-2.5">
            {Array.from({ length: 9 }, (_, i) => (
              <Skeleton key={i} className={`h-4 ${i === 8 ? "w-2/3" : "w-full"}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WordPrediction({ tokens, t, target }: { tokens: string[]; t: number; target: LanguageTarget }) {
  const context = tokens.slice(Math.max(0, t - 12), t).join("");
  const actual = tokens[t];
  const inTop = target.top.some(([token]) => token === actual);
  const alternatives = inTop ? target.top : [...target.top, [actual, target.p] as [string, number]];
  return (
    <div>
      <p className="kpsa-eyebrow mb-2">Next-token prediction</p>
      <p className="mb-3 text-[0.85rem] leading-relaxed text-[#5c5966]">
        {t > 12 && "…"}
        {context.replace(/\s+/g, " ").replace(/^\s/, "")}
        {/^\s/.test(actual) && " "}
        <span className="rounded-[2px] bg-[#3f21b6] font-medium text-white shadow-[0_0_0_2px_#3f21b6]">{tokenText(actual)}</span>
      </p>
      <p className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-[#4b4857]">
          Probability of <span className="font-mono text-[0.85rem] text-[#18161f]">{tokenText(actual)}</span>
        </span>
        <span className="text-lg font-medium tabular-nums text-[#3f21b6]">{prob(target.p)}</span>
      </p>
      <ul className="mt-2.5 space-y-1.5">
        {alternatives.map(([token, value]) => {
          const isActual = token === actual;
          return (
            <li key={token} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_3rem] items-center gap-x-3 text-xs">
              <span className={`truncate font-mono ${isActual ? "font-semibold text-[#3f21b6]" : "text-[#4b4857]"}`} title={JSON.stringify(token)}>
                {tokenText(token)}
              </span>
              <Bar value={value} tone={isActual ? "brand" : "muted"} />
              <span className="text-right tabular-nums text-[#4b4857]">{prob(value)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
