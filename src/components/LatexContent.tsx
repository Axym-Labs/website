import { useEffect, useMemo, useRef, type MouseEvent } from "react";
import { codeBlockText, preparePublicationHtml } from "@/lib/publication-html";

type MathJaxWindow = Window & {
  MathJax?: {
    tex?: Record<string, unknown>;
    startup?: Record<string, unknown>;
    typesetClear?: (elements: HTMLElement[]) => void;
    typesetPromise?: (elements: HTMLElement[]) => Promise<void>;
  };
};

let mathJaxPromise: Promise<void> | undefined;

const loadMathJax = () => {
  const mathWindow = window as MathJaxWindow;
  if (mathWindow.MathJax?.typesetPromise) return Promise.resolve();
  if (mathJaxPromise) return mathJaxPromise;

  mathWindow.MathJax = {
    tex: {
      inlineMath: [["\\(", "\\)"], ["$", "$"]],
      displayMath: [["\\[", "\\]"], ["$$", "$$"]],
    },
    startup: { typeset: false },
  };
  mathJaxPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("MathJax failed to load"));
    document.head.appendChild(script);
  });
  return mathJaxPromise;
};

interface LatexContentProps {
  children: string;
}

const LatexContent = ({ children }: LatexContentProps) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    loadMathJax()
      .then(() => (window as MathJaxWindow).MathJax?.typesetPromise?.([element]))
      .catch((error) => console.error(error));
    return () => (window as MathJaxWindow).MathJax?.typesetClear?.([element]);
  }, [children]);

  const html = useMemo(() => preparePublicationHtml(children), [children]);

  // One delegated handler serves every copy button in the rendered HTML.
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-copy-code]");
    const pre = button?.parentElement?.querySelector("pre");
    if (!button || !pre) return;
    navigator.clipboard
      .writeText(codeBlockText(pre))
      .then(() => {
        button.textContent = "Copied";
        window.setTimeout(() => {
          button.textContent = "Copy";
        }, 1600);
      })
      .catch(() => {
        button.textContent = "Select and copy";
      });
  };

  return <div ref={container} onClick={handleClick} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default LatexContent;
