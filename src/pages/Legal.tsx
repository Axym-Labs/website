import SitePage from "@/components/SitePage";

// Legal notice and privacy notice (GDPR Art. 13) for a privately run German
// website, structured after common generator templates (controller, hosting
// and server logs, cookies, third-party content, email, storage, transfers,
// rights). Kept general on purpose: processing is described by category, not
// by project, so new pages rarely require changes here. Providers are named
// only where the GDPR asks for recipients. No postal address, by the site
// owner's decision.

const Legal = () => (
  <SitePage
    title="Legal notice and privacy"
    metaTitle="Legal notice and privacy | Axym Labs"
    description="Legal notice (Impressum) and privacy notice (Datenschutzerklärung) for axym.org."
    path="/legal/"
  >
    <h2 id="impressum">Legal notice (Impressum)</h2>
    <p>
      Axym Labs is not a registered company or association. This website is run privately by Davide Wiest, Darmstadt, Germany, who is also responsible
      for its content under § 18 (2) MStV.
    </p>
    <p>
      Email: <a href="mailto:contact@axym.org">contact@axym.org</a>
    </p>

    <h2 id="privacy" className="scroll-mt-24">Privacy notice (Datenschutzerklärung)</h2>
    <h3>Controller</h3>
    <p>
      The controller under the General Data Protection Regulation (GDPR) is Davide Wiest, Darmstadt, Germany, reachable at{" "}
      <a href="mailto:contact@axym.org">contact@axym.org</a>. Write to this address for any question about your data or to exercise your rights.
    </p>

    <h3>Hosting and server logs</h3>
    <p>
      This website is hosted on GitHub Pages, a service of GitHub, Inc., 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA, and delivered over
      an encrypted (HTTPS) connection. When you open a page, your browser sends technical data such as your IP address, the requested address, the time,
      the referring page, and your browser and operating system. GitHub processes these data to deliver the site and logs the IP address for security
      purposes; how long GitHub keeps its logs is set out in{" "}
      <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub's privacy statement</a>. The legal basis is
      our legitimate interest in a secure and reliable website (Art. 6 (1) (f) GDPR). We do not have access to these logs and do not use them.
    </p>

    <h3>No cookies, analytics, or tracking</h3>
    <p>
      The site sets no cookies and uses no analytics, advertising, or tracking services. Fonts, images, and videos are served from axym.org itself.
    </p>

    <h3>Content loaded from third parties</h3>
    <p>Some pages load resources from other providers, which then receive your IP address and the technical request data described above:</p>
    <ul>
      <li>
        Pages with mathematical formulas load a math-rendering library from the content delivery network jsDelivr (cdn.jsdelivr.net); see the{" "}
        <a href="https://www.jsdelivr.com/terms/privacy-policy-jsdelivr-net">jsDelivr privacy policy</a>.
      </li>
      <li>
        Interactive demos can load models, datasets, or media from the hosts where we publish them, in particular Hugging Face (huggingface.co); see the{" "}
        <a href="https://huggingface.co/privacy">Hugging Face privacy policy</a>. The computations of these demos run in your browser, and files you
        choose or upload in a demo are not sent to us or to these hosts.
      </li>
    </ul>
    <p>
      The legal basis is our legitimate interest in presenting formulas and demos correctly (Art. 6 (1) (f) GDPR). Links to other websites transfer data
      to those sites only when you follow them.
    </p>

    <h3>Email</h3>
    <p>
      If you write to contact@axym.org or another axym.org address, we process your address, your message, and the metadata of the email to answer you and
      for any follow-up (Art. 6 (1) (b) GDPR where the message concerns a contract or its preparation, otherwise Art. 6 (1) (f) GDPR, our legitimate
      interest in answering inquiries). Emails to axym.org addresses are forwarded to and stored in a Gmail account, so Google Ireland Limited, Gordon
      House, Barrow Street, Dublin 4, Ireland, receives them as our email provider; see the{" "}
      <a href="https://policies.google.com/privacy">Google privacy policy</a>. There is no fixed retention period: we keep emails as long as they are
      needed for the conversation and its follow-up, and delete them earlier on request unless a legal obligation requires us to keep them.
    </p>

    <h3>Transfers outside the EU</h3>
    <p>
      GitHub, Google, Hugging Face, and the networks behind jsDelivr may process data in the United States or other countries outside the EU. GitHub and
      Google state that they participate in the EU-U.S. Data Privacy Framework, for which the European Commission has adopted an adequacy decision. For
      the other providers, the safeguards for such transfers, such as the EU standard contractual clauses, are described in their privacy policies.
    </p>

    <h3>Your rights</h3>
    <p>
      You have the right to access your personal data, to have it corrected or erased, to restrict its processing, to data portability, and to object
      to processing based on legitimate interests (Art. 15 to 21 GDPR). You can also lodge a complaint with a supervisory authority, for example the
      Hessian Commissioner for Data Protection and Freedom of Information (<a href="https://datenschutz.hessen.de">HBDI</a>), which is responsible
      for us.
    </p>
    <p>
      You are not obliged to provide personal data. Without the technical request data, however, pages cannot be delivered to you, and without your email
      address we cannot answer you. We do not use automated decision-making or profiling.
    </p>
  </SitePage>
);

export default Legal;
