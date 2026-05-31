import { cn } from "@/lib/utils";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizes: Record<AvatarSize, string> = {
  xs: "size-6 text-xs",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
  xl: "size-20 text-2xl",
};

const gradients = [
  "from-brand-400 to-accent-500",
  "from-violet-400 to-purple-600",
  "from-sky-400 to-blue-600",
  "from-emerald-400 to-teal-600",
  "from-rose-400 to-pink-600",
  "from-amber-400 to-orange-500",
];

function getGradient(name: string) {
  const code = name.charCodeAt(0) + (name.charCodeAt(1) || 0);
  return gradients[code % gradients.length];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type AvatarProps = {
  name: string;
  image?: string | null;
  size?: AvatarSize;
  className?: string;
};

export function Avatar({ name, image, size = "md", className }: AvatarProps) {
  const base = cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white", sizes[size], className);

  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={cn("rounded-full object-cover", sizes[size], className)}
      />
    );
  }

  return (
    <span className={cn("bg-gradient-to-br", getGradient(name || "U"), base)}>
      {getInitials(name || "User")}
    </span>
  );
}
