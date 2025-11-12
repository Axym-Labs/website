import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MoveRight, Zap, Shield, Eye, Cpu, Database, Lock } from "lucide-react";

interface WorkItem {
  slug: string;
  title: string;
  category: string;
  summary: string;
  cover_image?: string;
  cover_animated?: boolean;
  cover_poster?: string;
  use_cover_as_card_bg?: boolean;
  main_points?: [string, string][];
}

interface WorkCardProps {
  item: WorkItem;
}

const iconMap: Record<string, any> = {
  bolt: Zap,
  shield: Shield,
  eye: Eye,
  cpu: Cpu,
  database: Database,
  lock: Lock,
};

const WorkCard = ({ item }: WorkCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
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

  const categoryColor = {
    product: "bg-accent/10 text-accent",
    research: "bg-foreground/10 text-foreground",
    idea: "bg-foreground/10 text-foreground/80",
  }[item.category] || "bg-foreground/10 text-foreground";

  return (
    <Link
      to={`/work/${item.slug}`}
      className="block group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <article className="grid md:grid-cols-2 gap-8 p-8 rounded-lg transition-all duration-200 border border-transparent hover:border-accent bg-transparent">
        {/* Text Content - Left Column */}
        <div className="space-y-4 flex flex-col justify-center order-2 md:order-1">
          <h3 className="text-2xl font-bold text-foreground group-hover:text-accent transition-colors">
            {item.title}
            <span
              className={`inline-flex items-center gap-2 ml-3 transition-opacity duration-200 translate-y-1.5 ${
                isHovered ? "opacity-100" : "opacity-0"
              }`}
            >
            
              <MoveRight className="w-8 h-8" />
            </span>
          </h3>
          
          <p className="text-base text-foreground/70 leading-relaxed">
            {item.summary}
          </p>
        </div>

        {/* Cover Image - Right Column */}
        <div className="relative aspect-square rounded-lg overflow-hidden bg-muted order-1 md:order-2">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Cpu className="w-16 h-16" />
            </div>
          )}
        </div>
      </article>
    </Link>
  );
};

export default WorkCard;
