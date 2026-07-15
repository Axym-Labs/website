const Hero = () => (
  <section id="hero" className="flex min-h-[82vh] items-center px-6 pt-24 lg:px-8">
    <div className="mx-auto w-full max-w-6xl">
      <p className="mb-7 text-sm font-semibold uppercase tracking-[0.2em] text-foreground/50">
        Axym Labs
      </p>
      <h1 className="max-w-5xl text-4xl font-semibold leading-[1.08] text-foreground md:text-6xl lg:text-7xl">
        Axym Labs is a small organization conducting collaborative machine learning research.
      </h1>
      <p className="mt-8 max-w-3xl text-lg leading-relaxed text-foreground/65 md:text-xl">
        We develop methods for continual, local, and task-agnostic learning, and publish the papers, code, and project pages behind them.
      </p>
    </div>
  </section>
);

export default Hero;
