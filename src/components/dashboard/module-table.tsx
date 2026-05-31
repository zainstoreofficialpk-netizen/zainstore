import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ModuleTableProps = {
  title: string;
  description: string;
  columns: string[];
  rows: string[][];
  actionLabel?: string;
};

export function ModuleTable({ title, description, columns, rows, actionLabel = "Export" }: ModuleTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        </div>
        <Button variant="outline" size="sm" type="button">
          {actionLabel}
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              {columns.map((column) => (
                <th className="px-5 py-3 font-semibold" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <tr key={row.join("-")} className="hover:bg-zinc-50">
                {row.map((cell, index) => (
                  <td className="px-5 py-4 text-zinc-700" key={`${cell}-${index}`}>
                    {index === row.length - 1 ? <Badge tone={statusTone(cell)}>{cell}</Badge> : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function statusTone(status: string): "default" | "success" | "warning" | "danger" | "muted" {
  const normalized = status.toLowerCase();
  if (normalized.includes("active") || normalized.includes("paid") || normalized.includes("approved")) return "success";
  if (normalized.includes("pending") || normalized.includes("review")) return "warning";
  if (normalized.includes("rejected") || normalized.includes("failed") || normalized.includes("suspended")) return "danger";
  return "muted";
}
