const Footer = () => {
  return (
    <footer className="py-24 px-6 lg:px-8 border-t border-foreground/10">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-white/100 break-words">
          Axym Labs
        </div>
        
        <div className="space-y-4 text-base text-foreground/70">
          <p>
            For inquiries, contact:{" "}
            <a
              href="mailto:contact@axym.org"
              className="text-accent hover:underline"
            >
              contact@axym.org
            </a>
          </p>
          <p>
            GitHub:{" "}
            <a
              href="https://github.com/Axym-Labs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              github.com/Axym-Labs
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
