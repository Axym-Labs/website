interface CoverImageProps {
  src?: string;
  alt?: string;
  fit?: "contain" | "cover";
  className?: string;
  eager?: boolean;
}

const isCover = (src?: string) => Boolean(src?.includes("/work/covers/"));

/**
 * Card visual. Covers (public/work/covers/, 1600x900 with their own paper
 * edge) are shown as they are; other images, such as a paper's first figure,
 * sit on a paper-colored panel like a printed plate.
 */
const CoverImage = ({ src, alt = "", fit = "contain", className = "", eager = false }: CoverImageProps) => {
  if (isCover(src)) {
    return (
      <div className={`rounded-[0.7rem] ${className}`}>
        <img src={src} alt={alt} width={1600} height={900} loading={eager ? "eager" : "lazy"} decoding="async" className="block h-full w-full rounded-[0.7rem] object-cover" />
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden rounded-[0.7rem] border border-foreground/[0.08] bg-paper ${className}`}>
      {src && (
        <img
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className={
            fit === "cover"
              ? "absolute inset-0 h-full w-full object-cover"
              : "absolute inset-[7%] h-[86%] w-[86%] object-contain mix-blend-multiply"
          }
        />
      )}
    </div>
  );
};

export default CoverImage;
