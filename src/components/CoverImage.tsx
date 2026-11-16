interface CoverImageProps {
  src?: string;
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
const CoverImage = ({ src, fit = "contain", className = "", eager = false }: CoverImageProps) => {
  const motion = "transition-transform duration-500 ease-out group-hover:scale-[1.015] motion-reduce:transition-none";
  if (isCover(src)) {
    return (
      <div className={`rounded-[0.7rem] transition-[transform,box-shadow] duration-300 ease-out group-hover:-translate-y-0.5 group-hover:shadow-[0_14px_32px_-18px_rgba(24,22,31,0.35)] motion-reduce:transition-none ${className}`}>
        <img src={src} alt="" width={1600} height={900} loading={eager ? "eager" : "lazy"} decoding="async" className="block h-full w-full rounded-[0.7rem] object-cover" />
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden rounded-[0.7rem] border border-foreground/[0.08] bg-paper ${className}`}>
      {src && (
        <img
          src={src}
          alt=""
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className={
            fit === "cover"
              ? `absolute inset-0 h-full w-full object-cover ${motion}`
              : `absolute inset-[7%] h-[86%] w-[86%] object-contain mix-blend-multiply ${motion}`
          }
        />
      )}
    </div>
  );
};

export default CoverImage;
