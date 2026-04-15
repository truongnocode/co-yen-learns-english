/**
 * Admin: teacher analytics dashboard.
 *
 * Populated in Phase 5. For now it renders a scaffold that tells the teacher
 * what will appear here, so the admin nav isn't broken.
 */

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Theo dõi tiến độ học sinh và hiệu quả đề thi. Sẽ hoàn thiện ở Phase 5.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <PlaceholderCard title="Học sinh hoạt động" description="Số học sinh có làm bài trong 7/30 ngày qua." />
        <PlaceholderCard title="Điểm trung bình" description="Theo lớp, theo đề, theo kỹ năng." />
        <PlaceholderCard title="Câu hỏi khó nhất" description="Tỷ lệ sai cao nhất, xếp theo topic." />
        <PlaceholderCard title="Tiến độ cá nhân" description="Timeline điểm của mỗi học sinh." />
        <PlaceholderCard title="Heatmap điểm yếu" description="Topic / grammar rule học sinh sai nhiều nhất." />
        <PlaceholderCard title="Export CSV" description="Báo cáo tuần/tháng cho giáo viên in sao kê." />
      </div>
    </div>
  );
}

function PlaceholderCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
