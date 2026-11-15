import { PLATFORM_ICONS, type PlatformIconName } from "@/lib/platform-icons";

interface PlatformIconProps {
  name: PlatformIconName;
  className?: string;
}

const PlatformIcon = ({ name, className = "h-4 w-4" }: PlatformIconProps) => {
  const icon = PLATFORM_ICONS[name];
  const paint = icon.kind === "fill"
    ? { fill: "currentColor" }
    : { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false" {...paint}>
      {icon.paths.map((d) => <path key={d} d={d} />)}
    </svg>
  );
};

export default PlatformIcon;
