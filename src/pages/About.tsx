import { Link } from "react-router-dom";
import SitePage from "@/components/SitePage";

const DESCRIPTION =
  "Axym Labs is a small deep learning research group based in Darmstadt, Germany. It publishes papers, code, models, and data on continual, local, and task-agnostic learning, interpretability, and neuron simulation.";

const About = () => (
  <SitePage
    title="About Axym Labs"
    metaTitle="About | Axym Labs"
    description={DESCRIPTION}
    path="/about/"
    lead={
      <p>
        Axym Labs is a small deep learning research group based in Darmstadt, Germany. It is not a company or an institute but the name under which its
        members and collaborators publish their research and software.
      </p>
    }
  >
    <h2>What we work on</h2>
    <p>
      We combine theoretical analysis, empirical evaluation, and implementation to develop new deep-learning methods and improve existing ones, with a
      mild preference for unconventional ideas when they offer a credible alternative to established approaches. Our current work covers
    </p>
    <ul>
      <li>
        continual learning, with <Link to="/work/iewc/">Improved Elastic Weight Consolidation</Link>;
      </li>
      <li>
        local learning, with <Link to="/work/terel/">Temporal Regularized Learning</Link>;
      </li>
      <li>
        interpretability, with <Link to="/work/kpsa/">Kernelized Parameter Sensitivity Atlases</Link> and an analysis of a{" "}
        <Link to="/work/axosim-fly-geometry/">simulated fly brain</Link>;
      </li>
      <li>
        the structure of data distributions, with <Link to="/work/recursive-manifolds/">the recursive manifold hypothesis</Link>;
      </li>
      <li>
        neuron simulation, with <Link to="/work/axosim/">AxoSim</Link> and <Link to="/work/axobench/">AxoBench</Link>;
      </li>
      <li>
        task-agnostic pretraining, with <Link to="/work/pptrain/">pptrain</Link>; and scientific plotting, with <Link to="/work/marey/">Marey</Link>.
      </li>
    </ul>

    <h2>How we publish</h2>
    <p>
      Each project gets a page on this site with its main figure, a summary, its links, and a citation. Papers go to arXiv, code to{" "}
      <a href="https://github.com/Axym-Labs">GitHub</a>, and models and datasets to <a href="https://huggingface.co/Axym-Labs">Hugging Face</a>, so that
      others can reproduce the results and extend the methods. Shorter results appear as <Link to="/#updates">research updates</Link>.
    </p>

    <h2>People</h2>
    <p>
      The core team consists of <a href="https://davidewiest.com">Davide Wiest</a>, a computer science student at TU Darmstadt, and{" "}
      <a href="https://github.com/Jonathan-Schaefer-git">Jonathan Schäfer</a>, both based in Darmstadt. Collaborators co-author individual projects; Ahanaf
      Hasan Ariq and Abdul Monaf Chowdhury, for example, are co-authors of the KPSA paper.
    </p>

    <h2>Official channels</h2>
    <ul>
      <li>
        Website: <a href="https://axym.org">axym.org</a>, with the AxoSim documentation at <a href="https://axo.axym.org">axo.axym.org</a>
      </li>
      <li>
        Code: <a href="https://github.com/Axym-Labs">github.com/Axym-Labs</a>
      </li>
      <li>
        Models and datasets: <a href="https://huggingface.co/Axym-Labs">huggingface.co/Axym-Labs</a>
      </li>
      <li>
        Community: <a href="https://discord.gg/n3uqR4tnSv">Discord</a>
      </li>
      <li>
        Email: <a href="mailto:contact@axym.org">contact@axym.org</a>
      </li>
    </ul>
    <p>
      For questions, collaboration, or a paper's correspondence address, see <Link to="/contact/">Contact</Link>.
    </p>
  </SitePage>
);

export default About;
