import SitePage from "@/components/SitePage";

const Contact = () => (
  <SitePage
    title="Contact"
    metaTitle="Contact | Axym Labs"
    description="How to reach Axym Labs: email for questions and collaboration, the correspondence address for papers, and Discord."
    path="/contact/"
    lead={
      <p>
        Write to <a className="text-primary underline decoration-primary/30 underline-offset-[0.2em] hover:decoration-primary" href="mailto:contact@axym.org">contact@axym.org</a>{" "}
        for questions, collaboration, or anything else about our work.
      </p>
    }
  >
    <h2>Papers</h2>
    <p>
      For a question about a specific paper, write to its correspondence address, <a href="mailto:dw@axym.org">dw@axym.org</a>, which also appears in the
      links line of each project page.
    </p>

    <h2>Code and data</h2>
    <p>
      Bugs and feature requests are best filed as issues in the repository concerned on <a href="https://github.com/Axym-Labs">GitHub</a>, and questions
      about models or datasets on their <a href="https://huggingface.co/Axym-Labs">Hugging Face</a> pages.
    </p>

    <h2>Community</h2>
    <p>
      Our <a href="https://discord.gg/n3uqR4tnSv">Discord server</a> is open to anyone who wants to discuss the work or follow its progress.
    </p>

  </SitePage>
);

export default Contact;
