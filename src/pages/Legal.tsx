import SitePage from "@/components/SitePage";

// Legal notice and privacy notice (GDPR) for a privately run German website.
// No postal address by the owner's decision. Items marked TODO need the
// owner's input; the page shows them visibly so they are not missed.
const Todo = ({ children }: { children: string }) => <span className="todo">TODO for Davide: {children}</span>;

const Legal = () => (
  <SitePage
    title="Legal notice and privacy"
    metaTitle="Legal notice and privacy | Axym Labs"
    description="Legal notice (Impressum) and privacy notice (Datenschutzerklärung) for axym.org."
    path="/legal/"
  >
    <h2 id="impressum">Legal notice (Impressum)</h2>
    <p>
      Axym Labs is not a registered company or association. This website is run privately by Davide Wiest, Darmstadt, Germany, who is responsible for
      its content.
    </p>
    <p>
      Email: <a href="mailto:contact@axym.org">contact@axym.org</a>
    </p>

    <h2 id="privacy" className="scroll-mt-24">Privacy notice (Datenschutzerklärung)</h2>
    <h3>Controller</h3>
    <p>
      The controller under the General Data Protection Regulation (GDPR) is Davide Wiest, reachable at{" "}
      <a href="mailto:contact@axym.org">contact@axym.org</a>.
    </p>

    <h3>Hosting</h3>
    <p>
      This website is hosted on GitHub Pages, a service of GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA. When you open a
      page, GitHub processes your IP address and request data in server logs to deliver the site and to keep it secure; the legal basis is our
      legitimate interest in a reliable website (Art. 6 (1) (f) GDPR). Details are in{" "}
      <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub's privacy statement</a>.
    </p>

    <h3>No cookies, analytics, or tracking</h3>
    <p>
      The site sets no cookies and uses no analytics or tracking services. Fonts, images, and videos are served from axym.org itself, so opening a page
      does not contact font or advertising services.
    </p>

    <h3>Third-party content</h3>
    <ul>
      <li>
        Pages with mathematical formulas load the MathJax library from jsDelivr (cdn.jsdelivr.net), which receives your IP address when the library is
        requested; see the <a href="https://www.jsdelivr.com/terms/privacy-policy-jsdelivr-net">jsDelivr privacy policy</a>.
      </li>
      <li>
        The interactive connectome demo loads its image database from Hugging Face (huggingface.co), which receives your IP address with these requests;
        see the <a href="https://huggingface.co/privacy">Hugging Face privacy policy</a>. The simulation itself runs in your browser, and images you
        choose or upload in the demo do not leave your device.
      </li>
      <li>Links to other websites, such as GitHub, arXiv, or Discord, transfer data to those sites only when you follow them.</li>
    </ul>
    <p>The legal basis for these requests is our legitimate interest in presenting formulas and the demo correctly (Art. 6 (1) (f) GDPR).</p>

    <h3>Email</h3>
    <p>
      If you write to us, we use your address and message only to answer you (Art. 6 (1) (b) and (f) GDPR).
    </p>
    <Todo>state how long you keep emails, for example until the conversation is concluded.</Todo>

    <h3>Your rights</h3>
    <p>
      You have the right to access, rectification, erasure, restriction of processing, data portability, and to object to processing based on legitimate
      interests (Art. 15 to 21 GDPR). You can also lodge a complaint with a supervisory authority, for example the Hessian Commissioner for Data
      Protection and Freedom of Information (HBDI) in Wiesbaden.
    </p>
    <Todo>have this notice checked once, for example against a generator such as e-recht24, before publishing; it was drafted from the site's code, not by a lawyer.</Todo>
  </SitePage>
);

export default Legal;
