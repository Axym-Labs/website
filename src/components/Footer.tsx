const Footer = () => {
  return (
    <footer className="mt-32 py-24 md:py-36 px-6 lg:px-8 border-t border-foreground/10">
      <div className="max-w-7xl mx-auto space-y-20">
        <div className="md:text-center text-[6rem] md:text-[6rem] lg:text-[6rem] xl:text-[10rem] font-bold break-words leading-none">
          Axym Labs
        </div>
        
        <div className="flex justify-center gap-8 text-base text-foreground/70">
          <a
            href="mailto:contact@axym.org"
            className="text-accent underline"
          >
            Contact
          </a>
          <a
            href="https://github.com/Axym-Labs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline"
          >
            Github
          </a>
          <a
            href="/disclosure"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline"
          >
            Disclosure
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
