import { ModuleTable } from "@/components/dashboard/module-table";
import { Card, CardContent } from "@/components/ui/card";

type ModulePageProps = {
  title: string;
  description: string;
  columns: string[];
  rows: string[][];
  capabilities: string[];
};

export function ModulePage({ title, description, columns, rows, capabilities }: ModulePageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-950">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {capabilities.map((capability) => (
          <Card key={capability}>
            <CardContent>
              <p className="text-sm font-semibold text-zinc-800">{capability}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <ModuleTable title={`${title} Table`} description="Search, filters, pagination, approvals, bulk actions, and export hooks belong here." columns={columns} rows={rows} />
    </div>
  );
}
