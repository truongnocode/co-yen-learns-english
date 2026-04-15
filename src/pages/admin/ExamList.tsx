/**
 * Admin: list all exams stored in Firestore (`exams/{grade}/tests/{examId}`).
 * Read-only for now — editing happens on the Import page by re-uploading.
 */

import { useEffect, useMemo, useState } from "react";
import { collection, collectionGroup, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface ExamRow {
  path: string;
  id: string;
  title: string;
  grade: number;
  updatedAt: Date | null;
  partACount: number;
}

export default function ExamListPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<ExamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // collectionGroup("tests") matches every `exams/grade{N}/tests` collection.
        const snap = await getDocs(
          query(collectionGroup(db, "tests"), orderBy("updatedAt", "desc")),
        );
        const parsed: ExamRow[] = snap.docs.map((d) => {
          const data = d.data() as {
            title?: string;
            grade?: number;
            updatedAt?: { toDate?: () => Date } | Date;
            partA?: { questions?: unknown[] };
          };
          const ua = data.updatedAt;
          const date =
            ua && typeof ua === "object" && "toDate" in ua && typeof ua.toDate === "function"
              ? ua.toDate()
              : ua instanceof Date
                ? ua
                : null;
          return {
            path: d.ref.path,
            id: d.id,
            title: data.title ?? "(untitled)",
            grade: data.grade ?? 0,
            updatedAt: date,
            partACount: data.partA?.questions?.length ?? 0,
          };
        });
        setRows(parsed);
      } catch (e) {
        toast({
          variant: "destructive",
          title: "Không tải được danh sách",
          description: (e as Error).message,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const filtered = useMemo(() => {
    if (!filter) return rows;
    const q = filter.toLowerCase();
    return rows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        String(r.grade).includes(q),
    );
  }, [rows, filter]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Đang tải…</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Đề thi</h2>
        <p className="text-sm text-muted-foreground">
          Chưa có đề thi nào trong Firestore. Vào trang Import để thêm đề đầu tiên.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Đề thi</h2>
          <p className="text-sm text-muted-foreground">
            {rows.length} đề trong Firestore
          </p>
        </div>
        <Input
          placeholder="Tìm theo tên hoặc lớp…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tiêu đề</TableHead>
            <TableHead>Lớp</TableHead>
            <TableHead>Số câu (Part A)</TableHead>
            <TableHead>Cập nhật</TableHead>
            <TableHead>Path</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((r) => (
            <TableRow key={r.path}>
              <TableCell className="font-medium">{r.title}</TableCell>
              <TableCell>{r.grade || "—"}</TableCell>
              <TableCell>{r.partACount}</TableCell>
              <TableCell>
                {r.updatedAt ? r.updatedAt.toLocaleString("vi-VN") : "—"}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {r.path}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Tải lại
        </Button>
      </div>
    </div>
  );
}
