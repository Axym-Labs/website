import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Zap, Shield, Eye, Cpu, Database, Lock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { getWorkItems } from "@/data/work-items";
import type { WorkItem } from "@/data/work-items";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";
import { useEffect, useState } from "react";

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
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);

  useEffect(() => {
    getWorkItems().then(setWorkItems);
  }, []);

  const item = workItems.find((w) => w.slug === slug);

  if (!item) {
    return <Navigate to="/" replace />;
  }

  const categoryColor = {
    product: "bg-accent/10 text-accent",
    research: "bg-foreground/10 text-foreground",
    idea: "bg-foreground/10 text-foreground/80",
  }[item.category] || "bg-foreground/10 text-foreground";

  const [coverSrc, setCoverSrc] = useState(
    item.cover_animated ? item.cover_poster : item.cover_image
  );
  const [animatedLoaded, setAnimatedLoaded] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    if (item.cover_animated && !prefersReducedMotion && item.cover_image) {
      const img = new Image();
      img.src = item.cover_image;
      img.onload = () => {
        setAnimatedLoaded(true);
        setCoverSrc(item.cover_image);
      };
    }
  }, [item.cover_animated, item.cover_image]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header Band */}
      <header className="bg-background pt-24 pb-16 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/*
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          */}

          <div className="space-y-4 mt-24">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {item.title}
            </h1>

            <p className="text-xl text-foreground/80">
              {item.summary}
            </p>

            {item.main_points && item.main_points.length > 0 && (
              <div className="flex flex-col sm:flex-row flex-wrap gap-6 pt-6">
                {item.main_points.map(([iconKey, text], idx) => {
                  const Icon = iconMap[iconKey] || Zap;
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-4 p-4 md:px-10 md:py-8 text-base font-medium bg-transparent text-white border border-white rounded-lg"
                    >
                      <Icon className="w-8 md:w-10 h-8 md:h-10 flex-shrink-0" strokeWidth={1.5} />
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

      {item.cover_image && item.show_cover_in_detail && (
      <div className="flex justify-center rounded-lg order-1 md:order-2 translate-y-24">
        <div className="rounded-3xl shadow-2xl">
          {coverSrc ? (
            <img className="rounded-3xl"
              src={coverSrc}
              alt={item.title}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Cpu className="w-16 h-16" />
            </div>
          )}

        </div>
      </div>
      )}

      {/* Content Canvas */}
      <main className="">
        <article className="w-full bg-canvas text-canvas-foreground p-12 py-36 md:p-20 md:py-48 lg:p-48 lg:py-56 prose prose-lg prose-neutral max-w-none">
          <div className="flex justify-center">
            <div className="max-w-4xl">
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
            </div>
          </div>
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
