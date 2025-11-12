import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Zap, Shield, Eye, Cpu, Database, Lock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { workItems } from "@/data/work-items";
import Footer from "@/components/Footer";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

const iconMap: Record<string, any> = {
  bolt: Zap,
  shield: Shield,
  eye: Eye,
  cpu: Cpu,
  database: Database,
  lock: Lock,
};

const WorkDetail = () => {
  const { slug } = useParams();
  const item = workItems.find((w) => w.slug === slug);

  if (!item) {
    return <Navigate to="/" replace />;
  }

  const categoryColor = {
    product: "bg-accent/10 text-accent",
    research: "bg-foreground/10 text-foreground",
    idea: "bg-foreground/10 text-foreground/80",
  }[item.category] || "bg-foreground/10 text-foreground";

  return (
    <div className="min-h-screen bg-background">
      {/* Header Band */}
      <header className="bg-background border-b border-foreground/10 pt-24 pb-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {item.title}
            </h1>

            <p className="text-xl text-foreground/80">
              {item.summary}
            </p>

            {item.main_points && item.main_points.length > 0 && (
              <div className="flex flex-wrap gap-6 pt-6">
                {item.main_points.map(([iconKey, text], idx) => {
                  const Icon = iconMap[iconKey] || Zap;
                  return (
                    <span
                      key={idx}
                      className="inline-flex flex-col items-start gap-4 px-10 py-9 text-base font-medium bg-transparent text-white border border-white rounded-lg"
                    >
                      <Icon className="w-10 h-10 flex-shrink-0" />
                      {text}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* External URL Banner */}
      {item.external_url && (
        <div className="bg-accent/10 border-b border-accent/20 py-4 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <a
              href={item.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-accent hover:underline font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              View external project
            </a>
          </div>
        </div>
      )}

      {/* Content Canvas */}
      <main className="py-48">
        <article className="w-full bg-canvas text-canvas-foreground p-12 md:p-20 lg:p-32 prose prose-lg prose-neutral max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeHighlight, rehypeKatex]}
            components={{
              pre: ({ children }) => (
                <pre className="bg-background text-foreground font-mono text-sm p-4 rounded-lg overflow-x-auto border border-foreground/10">
                  {children}
                </pre>
              ),
              code: ({ children, className }) => {
                const isInline = !className;
                return isInline ? (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                    {children}
                  </code>
                ) : (
                  <code className={className}>{children}</code>
                );
              },
            }}
          >
            {item.content}
          </ReactMarkdown>
        </article>
      </main>

      {/* What's Next Section */}
      {item.links && item.links.length > 0 && (
        <section className="py-24 border-t border-foreground/10">
          <div className="px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <h2 className="text-3xl font-bold text-foreground">
                What's Next
              </h2>

              <div className="flex flex-col sm:flex-row gap-4">
                {item.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 rounded-md transition-colors"
                  >
                    {link.label}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default WorkDetail;
