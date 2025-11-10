const Footer = () => {
  return (
    <footer className="py-24 px-6 lg:px-8 border-t border-foreground/10">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-6xl md:text-7xl lg:text-8xl font-bold text-foreground/5">
          Axym Labs
        </div>
        
        <p className="text-base text-foreground/70">
          For inquiries, contact:{" "}
          <a
            href="mailto:contact@axym.org"
            className="text-accent hover:underline"
          >
            contact@axym.org
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
