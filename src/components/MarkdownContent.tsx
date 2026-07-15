import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

interface MarkdownContentProps {
  children: string;
}

const MarkdownContent = ({ children }: MarkdownContentProps) => (
  <div className="markdown-content">
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeKatex]}
      components={{
        table: ({ children: tableChildren }) => (
          <div className="markdown-table-scroll">
            <table>{tableChildren}</table>
          </div>
        ),
        pre: ({ children: preChildren }) => (
          <pre className="bg-background text-foreground font-mono text-sm p-4 rounded-lg overflow-x-auto border border-foreground/10">
            {preChildren}
          </pre>
        ),
        code: ({ children: codeChildren, className }) => {
          const isInline = !className;
          return isInline ? (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
              {codeChildren}
            </code>
          ) : (
            <code className={className}>{codeChildren}</code>
          );
        },
      }}
    >
      {children}
    </ReactMarkdown>
  </div>
);

export default MarkdownContent;
