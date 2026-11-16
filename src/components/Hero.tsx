// White hero: plain statement on the left; on the right, contour lines of a
// loss landscape with one momentum-descent trajectory into its minimum
// (public/backgrounds/hero-landscape.svg, from scripts/hero-landscape/).
const Hero = () => (
  <section id="hero" className="relative overflow-hidden px-5 pb-20 pt-32 sm:px-6 md:pb-28 md:pt-40 lg:px-8">
    <img
      alt=""
      aria-hidden="true"
      width={1200}
      height={900}
      fetchPriority="high"
      src="/backgrounds/hero-landscape.svg"
      className="hero-landscape pointer-events-none absolute -right-[22rem] top-6 w-[64rem] max-w-none sm:-right-60 md:-right-40 md:top-0 lg:-right-16 xl:right-[calc(50%-46rem)]"
    />
    <div className="relative z-10 mx-auto w-full max-w-6xl">
      <h1 className="max-w-[50rem] font-serif text-[2.6rem] font-normal leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[3.6rem] lg:text-[4.25rem]">
        Axym Labs is a small organization conducting collaborative deep learning research.
      </h1>
      <p className="mt-8 max-w-[36rem] text-lg leading-relaxed text-muted-foreground md:text-[1.2rem]">
        We work on continual, local, and task-agnostic learning, interpretability, and neuron simulation, and publish the code, data, and theory behind each result.
      </p>
      <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-[0.95rem]">
        <a href="#work" className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-colors hover:bg-[#2f1889]">
          Our work
        </a>
        <a href="#updates" className="font-medium text-foreground underline decoration-foreground/25 underline-offset-[0.25em] transition-colors hover:text-primary hover:decoration-primary/50">
          Research updates
        </a>
      </div>
    </div>
  </section>
);

export default Hero;
