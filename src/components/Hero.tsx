const Hero = () => (
  <section id="hero" className="relative flex min-h-[82vh] items-center overflow-hidden px-6 pt-24 lg:px-8">
    <img
      alt=""
      aria-hidden="true"
      width={720}
      height={405}
      fetchPriority="high"
      src="/backgrounds/interference-caustics.webp"
      className="pointer-events-none absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
    />
    <img
      alt=""
      aria-hidden="true"
      width={720}
      height={405}
      src="/backgrounds/interference-caustics-poster.png"
      className="pointer-events-none absolute inset-0 hidden h-full w-full object-cover motion-reduce:block"
    />
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/55 to-background/5" />
    <div className="relative z-10 mx-auto w-full max-w-6xl">
      <h1 className="max-w-5xl text-4xl font-semibold leading-[1.08] text-foreground md:text-6xl lg:text-7xl">
        Axym Labs is a small organization conducting collaborative machine learning research.
      </h1>
      <p className="mt-8 max-w-3xl text-lg leading-relaxed text-foreground/65 md:text-xl">
        We develop and improve methods across continual, local, task-agnostic, and other learning settings. We publish the code, data, and theory behind them.
      </p>
    </div>
  </section>
);

export default Hero;
