import HeroField from "@/components/HeroField";

// The statement in two voices: a plain sans sentence that says what Axym
// Labs is, continued in serif with what it works on.
const Hero = () => (
  <section id="hero" className="relative overflow-hidden px-5 pb-24 pt-32 sm:px-6 md:pb-32 md:pt-44 lg:px-8">
    <HeroField className="hero-field pointer-events-none absolute inset-0 h-full w-full" />
    <div className="relative z-10 mx-auto w-full max-w-6xl">
      <h1 className="max-w-[50rem] text-[1.9rem] font-normal leading-[1.2] tracking-[-0.018em] text-foreground sm:text-[2.4rem] lg:text-[2.7rem]">
        <span className="font-semibold">Axym Labs is a small deep learning research group.</span>{" "}
        <span className="font-serif text-[1.05em] text-foreground/75">
          We work on learning methods, neuron simulation, and interpretability, and we publish the code, data, and theory behind each result.
        </span>
      </h1>
    </div>
  </section>
);

export default Hero;
