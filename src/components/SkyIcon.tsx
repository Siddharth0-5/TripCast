/**
 * SkyIcon: Lucide icon for a WMO weather code.
 */
import { Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, type LucideProps } from "lucide-react";
import { describeSky, type SkyKind } from "@/lib/weather-codes";

const ICONS: Record<SkyKind, React.ComponentType<LucideProps>> = {
  clear: Sun,
  partly: CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
};

export function SkyIcon({ code, ...props }: { code: number } & LucideProps) {
  const { kind, label } = describeSky(code);
  const Icon = ICONS[kind];
  return <Icon strokeWidth={1.5} aria-label={label} {...props} />;
}
