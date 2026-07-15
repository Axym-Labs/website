import { useEffect, useRef } from "react";

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

  return <div ref={container} dangerouslySetInnerHTML={{ __html: children }} />;
};

export default LatexContent;
