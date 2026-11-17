import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { setPageMetadata } from "@/lib/seo";
import { useJson } from "@/demo/kpsa/data";
import LanguageView, { type LanguageSelection } from "@/demo/kpsa/LanguageView";
import SegmentedToggle from "@/demo/kpsa/SegmentedToggle";
import type { App, LanguageIndex, Modality, VisionIndex } from "@/demo/kpsa/types";
import VisionView, { type VisionSelection } from "@/demo/kpsa/VisionView";

export const DEMO_SLUG = "kpsa-demo";
const TITLE = "Interactive KPSA Demo";
const SUMMARY =
  "Pick an image or a word and see which MLP features of a vision or language model KPSA ranks for it: the features the loss is most sensitive to, and a sparse sensitivity circuit across depth.";

const APPS: { value: App; label: string; short: string }[] = [
  { value: "attribution", label: "Activation attribution", short: "Attribution" },
  { value: "circuit", label: "Circuit discovery", short: "Circuits" },
];
const MODALITIES: { value: Modality; label: string }[] = [
  { value: "language", label: "Language" },
  { value: "vision", label: "Vision" },
];

const LEADS: Record<App, string> = {
  attribution:
    "Features are ranked by their KPSA score, the estimated share of the loss's sensitivity they hold on this input. Sensitivity measures how strongly the loss responds to a feature, not in which direction, so the intervention table scales the top features down, off, and up. Select one to see where it is active and the dataset examples that activate it most.",
  circuit:
    "The top-ranked features at a budget form a sensitivity circuit: a sparse set of parameter groups across depth whose perturbation changes the output. Select a node to open its feature.",
};

function ModelLine({ modality }: { modality: Modality }) {
  const { data } = useJson<VisionIndex | LanguageIndex>(`${modality}/index.json`);
  if (!data) return <p className="h-5" aria-hidden />;
  const sources = modality === "vision" ? "source images" : "source contexts";
  return (
    <p className="text-[0.8rem] leading-5 text-[#5c5966]">
      <span className="font-medium text-[#18161f]">{data.model}</span>
      <span className="mx-1.5 text-[#b9b5c4]">·</span>
      query space {data.queryModel}
      <span className="mx-1.5 text-[#b9b5c4]">·</span>
      atlas of {data.atlasSources.toLocaleString("en-US")} {sources}
      {"excluded" in data && data.excluded ? (
        <>
          <span className="mx-1.5 text-[#b9b5c4]">·</span>
          <Link to="/work/qwen-sensitivity-hubs/" className="kpsa-link">
            {data.excluded.count} features that hold {Math.round(data.excluded.share * 100)} % of the average input's sensitivity
          </Link>{" "}
          are not ranked
        </>
      ) : null}
    </p>
  );
}

const KpsaDemo = () => {
  const [params, setParams] = useSearchParams();
  const app: App = params.get("app") === "circuit" ? "circuit" : "attribution";
  const modality: Modality = params.get("mod") === "language" ? "language" : "vision";
  const [vision, setVision] = useState<VisionSelection>({});
  const [language, setLanguage] = useState<LanguageSelection>({});

  useEffect(() => {
    setPageMetadata({ title: `${TITLE} | Axym Labs`, description: SUMMARY, path: `/work/${DEMO_SLUG}/`, type: "article" });
  }, []);

  const setView = useCallback(
    (next: { app?: App; mod?: Modality }) => {
      setParams(
        (current) => {
          const out = new URLSearchParams(current);
          out.set("app", next.app ?? app);
          out.set("mod", next.mod ?? modality);
          return out;
        },
        { replace: true },
      );
    },
    [app, modality, setParams],
  );

  const updateVision = useCallback((next: Partial<VisionSelection>) => setVision((s) => ({ ...s, ...next })), []);
  const updateLanguage = useCallback((next: Partial<LanguageSelection>) => setLanguage((s) => ({ ...s, ...next })), []);

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <main className="pt-16">
        <article className="publication-canvas kpsa-page w-full bg-canvas px-4 py-16 text-canvas-foreground sm:px-8 sm:py-20 md:px-12 lg:px-16">
          <div className="latex-publication mx-auto w-full min-w-0 max-w-[46rem]">
            <header className="publication-head">
              <div className="publication-title-block">
                <h1 className="publication-title">{TITLE}</h1>
                <p className="publication-authors">Davide Wiest</p>
              </div>
            </header>
            <p>
              <Link to="/work/kpsa/">Kernelized Parameter Sensitivity Atlases</Link> (KPSA) estimate, for a new input and without a backward pass, which
              MLP features a model's loss is most sensitive to. An atlas stores sensitivity profiles measured on source inputs, and a kernel in a query
              representation space retrieves them for the new input. Pick an image, or a word in a passage, to see what KPSA returns for the paper's two
              applications: which features to intervene on to change the output, and a sparse sensitivity circuit across depth. How these sensitivities are
              organized by ImageNet classes is the subject of our <Link to="/work/kpsa-class-sensitivity/">research update</Link>.
            </p>
          </div>

          <div className="mx-auto mt-10 w-full max-w-[72rem]">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
              <SegmentedToggle label="Application" options={APPS} value={app} onChange={(value) => setView({ app: value })} />
              <SegmentedToggle label="Modality" options={MODALITIES} value={modality} onChange={(value) => setView({ mod: value })} />
            </div>
            <div className="mt-4 max-w-[46rem] space-y-1.5">
              <ModelLine modality={modality} />
              <p className="text-[0.9rem] leading-relaxed text-[#4b4857]">{LEADS[app]}</p>
            </div>

            <div className="mt-7 min-h-[40rem]">
              {modality === "vision" ? <VisionView app={app} sel={vision} update={updateVision} /> : <LanguageView app={app} sel={language} update={updateLanguage} />}
            </div>
          </div>

          <div className="latex-publication mx-auto mt-16 w-full min-w-0 max-w-[46rem]">
            <p className="text-sm text-[#4b4857]">
              Interface patterns adapted from <a href="https://github.com/hijohnnylin/neuronpedia">Neuronpedia</a> (Apache-2.0) and{" "}
              <a href="https://github.com/safety-research/circuit-tracer">circuit-tracer</a> (MIT). Query image sources and licenses are linked under each
              image; atlas and feature images come from ImageNet. Passages and text snippets are excerpts of the linked Wikipedia articles (CC BY-SA 4.0).
              Code: <a href="https://github.com/Axym-Labs/kpsa">github.com/Axym-Labs/kpsa</a>.
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default KpsaDemo;
