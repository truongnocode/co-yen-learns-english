/**
 * Admin: teacher analytics dashboard.
 *
 * Reads aggregated data from `lib/analytics.ts` (which in turn reads `users/*`
 * and `progress/*` — schema already shipped). No new Firestore fields needed.
 *
 * Layout:
 *   - Summary row: totals + activity + class average
 *   - 30-day timeline (attempts + avg %)
 *   - Weakest units (ascending avg %, teacher re-teaches these first)
 *   - Student table with per-student drilldown of quiz history
 *   - CSV export of every attempt
 */

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  loadAnalytics,
  type AnalyticsBundle,
  type AttemptRow,
  type StudentSummary,
} from "@/lib/analytics";

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [bundle, setBundle] = useState<AnalyticsBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const b = await loadAnalytics();
        setBundle(b);
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Không tải được analytics",
          description: (e as Error).message,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const filteredStudents = useMemo(() => {
    if (!bundle) return [];
    if (!filter) return bundle.students;
    const q = filter.toLowerCase();
    return bundle.students.filter(
      (s) =>
        s.displayName.toLowerCase().includes(q) ||
        String(s.grade ?? "").includes(q),
    );
  }, [bundle, filter]);

  const selectedStudent = useMemo<StudentSummary | null>(() => {
    if (!bundle || !selectedUid) return null;
    return bundle.students.find((s) => s.uid === selectedUid) ?? null;
  }, [bundle, selectedUid]);

  const selectedAttempts = useMemo<AttemptRow[]>(() => {
    if (!bundle || !selectedUid) return [];
    return bundle.attempts
      .filter((a) => a.uid === selectedUid)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [bundle, selectedUid]);

  function exportCsv() {
    if (!bundle) return;
    const csv = Papa.unparse(
      bundle.attempts.map((a) => ({
        uid: a.uid,
        student: a.displayName,
        studentGrade: a.grade ?? "",
        date: a.date,
        examGrade: a.entryGrade,
        unit: a.unit,
        score: a.score,
        total: a.total,
        percent: a.percent,
      })),
    );
    const today = new Date().toISOString().slice(0, 10);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `co-yen-attempts-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Đang tải dữ liệu…</p>;
  }

  if (!bundle) {
    return (
      <p className="text-sm text-muted-foreground">
        Chưa có dữ liệu để hiển thị.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Tổng quan tiến độ lớp học — cập nhật mỗi lần mở trang.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv}>
            Tải CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Tải lại
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Học sinh"
          value={bundle.totalStudents}
          sub={`${bundle.students.filter((s) => s.attempts > 0).length} đã làm bài`}
        />
        <StatCard
          label="Hoạt động 7 ngày"
          value={bundle.activeWeek}
          sub={`${bundle.activeMonth} trong 30 ngày`}
        />
        <StatCard
          label="Điểm TB lớp"
          value={`${bundle.classAvgPercent}%`}
          sub={`${bundle.attempts.length} lượt làm bài`}
        />
        <StatCard
          label="Bài học nhiều lỗi"
          value={bundle.units.length}
          sub={
            bundle.units[0]
              ? `Kém nhất: ${bundle.units[0].unit} (${bundle.units[0].avgPercent}%)`
              : "Chưa có dữ liệu"
          }
        />
      </div>

      {/* Timeline chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tiến độ 30 ngày</CardTitle>
        </CardHeader>
        <CardContent>
          {bundle.daily.every((d) => d.attempts === 0) ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chưa có lượt làm bài nào trong 30 ngày qua.
            </p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bundle.daily}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d: string) => d.slice(5)}
                    className="text-xs"
                  />
                  <YAxis yAxisId="left" className="text-xs" />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    className="text-xs"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      borderColor: "hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="attempts"
                    name="Số lượt"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgPercent"
                    name="Điểm TB %"
                    stroke="hsl(142 71% 45%)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weakest units */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Bài học yếu nhất (điểm TB thấp → cao)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bundle.units.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có bài nào được làm.
            </p>
          ) : (
            <>
              <div className="mb-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bundle.units.slice(0, 10)}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="unit"
                      className="text-xs"
                      tickFormatter={(u: string) =>
                        u.length > 14 ? u.slice(0, 12) + "…" : u
                      }
                    />
                    <YAxis domain={[0, 100]} className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        borderColor: "hsl(var(--border))",
                      }}
                    />
                    <Bar
                      dataKey="avgPercent"
                      name="Điểm TB %"
                      fill="hsl(0 72% 51%)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lớp</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Số lượt</TableHead>
                    <TableHead>Điểm TB</TableHead>
                    <TableHead>Kém nhất</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bundle.units.map((u) => (
                    <TableRow key={u.key}>
                      <TableCell>{u.grade}</TableCell>
                      <TableCell className="font-medium">{u.unit}</TableCell>
                      <TableCell>{u.attempts}</TableCell>
                      <TableCell>
                        <span
                          className={
                            u.avgPercent < 50
                              ? "text-red-600 font-semibold"
                              : u.avgPercent < 70
                                ? "text-amber-600"
                                : ""
                          }
                        >
                          {u.avgPercent}%
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.worst
                          ? `${u.worst.percent}% (${u.worst.date.slice(0, 10)})`
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* Students + drilldown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg">Học sinh</CardTitle>
            <Input
              placeholder="Tìm theo tên hoặc lớp…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Lớp</TableHead>
                <TableHead>Lượt</TableHead>
                <TableHead>Điểm TB</TableHead>
                <TableHead>XP</TableHead>
                <TableHead>Hoạt động gần nhất</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((s) => (
                <TableRow
                  key={s.uid}
                  className={selectedUid === s.uid ? "bg-muted/40" : ""}
                >
                  <TableCell className="font-medium">{s.displayName}</TableCell>
                  <TableCell>{s.grade ?? "—"}</TableCell>
                  <TableCell>{s.attempts}</TableCell>
                  <TableCell>
                    {s.attempts > 0 ? (
                      <span
                        className={
                          s.avgPercent < 50
                            ? "text-red-600 font-semibold"
                            : s.avgPercent < 70
                              ? "text-amber-600"
                              : "text-green-600"
                        }
                      >
                        {s.avgPercent}%
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{s.totalXp}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {s.lastActive ? s.lastActive.slice(0, 10) : "chưa làm"}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setSelectedUid(selectedUid === s.uid ? null : s.uid)
                      }
                      disabled={s.attempts === 0}
                    >
                      {selectedUid === s.uid ? "Đóng" : "Chi tiết"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredStudents.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-sm text-muted-foreground"
                  >
                    Không có học sinh nào khớp.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Per-student drilldown */}
      {selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Lịch sử làm bài — {selectedStudent.displayName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAttempts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có lượt làm bài nào.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Lớp</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Điểm</TableHead>
                    <TableHead>%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedAttempts.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">
                        {a.date.slice(0, 10)}
                      </TableCell>
                      <TableCell>{a.entryGrade}</TableCell>
                      <TableCell>{a.unit}</TableCell>
                      <TableCell>
                        {a.score}/{a.total}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            a.percent < 50
                              ? "text-red-600 font-semibold"
                              : a.percent < 70
                                ? "text-amber-600"
                                : "text-green-600"
                          }
                        >
                          {a.percent}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}
