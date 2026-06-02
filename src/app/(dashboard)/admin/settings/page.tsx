import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const settings = await db.settings.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });
  const groups = [...new Set(settings.map((s) => s.group))];

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-bold text-zinc-950">Platform Settings</h2>
        <p className="mt-0.5 text-sm text-zinc-400">Key-value configuration settings stored in the database.</p></div>

      {settings.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-zinc-400">
          No settings configured yet. Settings are stored in the database under key-value pairs.
        </CardContent></Card>
      ) : (
        groups.map((group) => (
          <Card key={group}>
            <CardHeader><CardTitle className="capitalize">{group}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-50">
                {settings.filter((s) => s.group === group).map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-800">{s.key}</p>
                      {s.description && <p className="text-xs text-zinc-400 mt-0.5">{s.description}</p>}
                    </div>
                    <Badge tone="muted" className="font-mono text-xs max-w-[200px] truncate">
                      {JSON.stringify(s.value).slice(0, 40)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
