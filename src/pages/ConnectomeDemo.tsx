import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { setPageMetadata } from "@/lib/seo";
import { loadPacked, type ReferenceStats } from "@/demo/connectome/assets";
import { loadDatabase, loadReferenceStats, type Database } from "@/demo/connectome/database";
import ImageSection from "@/demo/connectome/ImageSection";
import type { CloudLayer } from "@/demo/connectome/StateSpace";
import { ASSET_BASE, useSimulator } from "@/demo/connectome/useSimulator";
import VideoSection from "@/demo/connectome/VideoSection";

export const DEMO_SLUG = "axosim-connectome-demo";
const TITLE = "Interactive Connectome Demo";
const SUMMARY =
  "Run a 45,669-neuron simulated fly visual system in your browser: follow its population trajectory under video, or find the images it treats alike and test how stable its response is.";

const ConnectomeDemo = () => {
  const sim = useSimulator();
  const [cloud, setCloud] = useState<CloudLayer | null>(null);
  const [db, setDb] = useState<Database | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [reference, setReference] = useState<ReferenceStats | null>(null);
  const [lattice, setLattice] = useState<{ x: number[]; y: number[] } | null>(null);

  useEffect(() => {
    setPageMetadata({ title: `${TITLE} | Axym Labs`, description: SUMMARY, path: `/work/${DEMO_SLUG}/`, type: "article" });
    loadPacked(ASSET_BASE, "state-cloud").then(({ arrays }) => {
      const coords = arrays.coords as Float32Array;
      const labels = arrays.labels as Uint8Array;
      const colors = new Float32Array(coords.length);
      for (let i = 0; i < labels.length; i++) {
        // Image-hold states in pale violet, preset-video states slightly warmer.
        const video = labels[i] > 0;
        colors.set(video ? [0.78, 0.7, 0.62] : [0.6, 0.58, 0.8], i * 3);
      }
      setCloud({ coords, colors, size: 0.02, opacity: 0.32 });
    });
    fetch(`${ASSET_BASE}/runtime.json`)
      .then((r) => r.json())
      .then((rt) => setLattice({ x: rt.lattice_x, y: rt.lattice_y }));
    loadReferenceStats(ASSET_BASE).then(setReference).catch(() => undefined);
    loadDatabase()
      .then(setDb)
      .catch((error) => setDbError(`Image database unavailable (${error.message}).`));
  }, []);

  const images = reference ? reference.images.toLocaleString() : "the";
  const stableShare = useMemo(() => (reference ? `${Math.round(reference.stableFraction * 100)}%` : null), [reference]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <article className="publication-canvas connectome-page w-full bg-canvas px-5 py-16 text-canvas-foreground sm:px-8 sm:py-20 md:px-12 lg:px-16">
          <div className="latex-publication mx-auto w-full min-w-0 max-w-[46rem]">
            <header className="publication-head">
              <div className="publication-title-block">
                <h1 className="publication-title">{TITLE}</h1>
                <p className="publication-authors">Davide Wiest</p>
                <p className="publication-affiliations">Axym Labs</p>
              </div>
            </header>
            <p>
              This page runs the simulated fly visual circuit from our research update{" "}
              <Link to="/work/axosim-fly-geometry/">Finding Visual Dynamics in a Simulated Fly Brain</Link> in your browser. Each of the 45,669 cells of the
              FlyVis connectome is one pretrained AxoSim–Lite neuron model, connected by 1.5 million synapses. The simulation runs on your graphics card through
              WebGPU, or on your processor where WebGPU is unavailable, and nothing you choose or upload leaves your device. The demo is part of the{" "}
              <a href="https://axo.axym.org">AxoSim line of work</a> on learned neuron models for fast population simulation.
            </p>
            <p className="text-sm text-[#4b5563]" aria-live="polite">
              {sim.error ? `Simulator error: ${sim.error}` : sim.status}
            </p>
          </div>

          <section className="latex-publication mx-auto mt-16 w-full min-w-0 max-w-[46rem]" aria-labelledby="video-heading">
            <h2 id="video-heading">Follow the circuit through a video</h2>
            <p>
              Pick a clip. Every frame is converted to luminance, sampled at the 721 columns of the fly's hexagonal retina and contrast-normalized, then fed
              to the photoreceptors every 4 milliseconds after one second of uniform gray. Each trajectory point is the state of 2,884 recorded neurons
              (cell types L1, Mi1, T4c and T5c in every column), projected onto 50 principal components and placed into a three-dimensional UMAP by its
              nearest reference states, as in the article's film.
            </p>
            <p>
              The pale cloud holds reference states from {images} database images and the preset clips. The line shows the path so far and its bright end
              the last 1.6 seconds. Drag to rotate the view.
            </p>
          </section>
          <div className="mx-auto mt-8 w-full max-w-[72rem]">
            <VideoSection sim={sim} cloud={cloud} />
          </div>

          <section className="latex-publication mx-auto mt-24 w-full min-w-0 max-w-[46rem]" aria-labelledby="image-heading">
            <h2 id="image-heading">Find the images the circuit treats alike</h2>
            <p>
              Pick or upload an image. After one second of gray, the circuit sees the image unchanged for five seconds, as in the held frames at the end of
              the article's film. The mean state from two to five seconds summarizes where the population settles. We place it into a ten-dimensional UMAP
              fitted on {images} openly licensed images that went through the same simulation, and return the five nearest.
            </p>
            <p>
              The statistics use the same 50-component latent space. Latent speed is the mean distance travelled per second. Density is the share of
              reference states in sparser regions, judged by the distance to the tenth-nearest neighbour. A stable orbit means that the state approached
              its late orbit by at least 1.25× and kept the same dominant frequency and amplitude across the last two 1.5-second windows, the gates used for
              the film{stableShare ? `; ${stableShare} of database images pass them` : ""}. For stable orbits we then displace all 478,812 free recurrent
              variables by 0.25 standard deviations of their orbit, in eight random directions, and record how quickly the recorded state returns: τ is the
              integrated distance in excess of an unperturbed copy, normalized by the initial displacement. Every percentile compares against the identical
              protocol run on the database.
            </p>
          </section>
          <div className="mx-auto mt-8 w-full max-w-[72rem]">
            <ImageSection sim={sim} cloud={cloud} db={db} dbError={dbError} reference={reference} lattice={lattice} />
          </div>

          <div className="latex-publication mx-auto mt-20 w-full min-w-0 max-w-[46rem]">
            <p className="text-sm text-[#4b5563]">
              The neuron model was trained on mammalian layer-5 pyramidal neurons, so these dynamics describe this simulator on the fly graph rather than
              measured fly physiology. Code: <a href="https://github.com/Axym-Labs/axosim-demo">github.com/Axym-Labs/axosim-demo</a>. Image sources and
              licenses are linked under each result.
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default ConnectomeDemo;
