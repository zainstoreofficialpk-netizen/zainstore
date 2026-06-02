import Link from "next/link";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({ icon = "📭", title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <span className="text-5xl">{icon}</span>
      <p className="text-base font-semibold text-zinc-700">{title}</p>
      {description && <p className="max-w-sm text-sm text-zinc-400">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button size="sm" className="mt-2">{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}
