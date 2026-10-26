import { useState } from 'react';
import { StudentIdentityFields } from './ExamSubmission';
import { readStudentIdentity, rememberStudentIdentity, validIdentity, type StudentIdentity } from '@/lib/examSubmissions';

export default function ExamStudentStart({ title, saved, onStart, hasUnnamed = false }: { title: string; saved: (identity: StudentIdentity) => { answered: number; submitted: boolean } | null; onStart: (identity: StudentIdentity, resumeUnnamed: boolean) => void; hasUnnamed?: boolean }) {
  const [identity, setIdentity] = useState(readStudentIdentity);
  const [resumeUnnamed, setResumeUnnamed] = useState(false);
  const previous = validIdentity(identity) ? saved(identity) : null;
  return <form className="mx-auto my-6 max-w-xl rounded-3xl border border-border bg-card p-5 shadow-1 sm:p-7" aria-label="Thông tin trước khi làm bài" onSubmit={event => {
    event.preventDefault(); if (!validIdentity(identity)) return;
    const clean = { studentName: identity.studentName.trim(), className: identity.className.trim() };
    rememberStudentIdentity(clean); onStart(clean, resumeUnnamed);
  }}>
    <p className="text-sm font-bold text-primary">{title}</p><h1 className="mb-4 mt-2 font-display text-2xl font-extrabold">Em là học sinh nào?</h1>
    <StudentIdentityFields value={identity} onChange={value => { setIdentity(value); setResumeUnnamed(false); }} />
    <p className="mt-3 text-sm text-muted-foreground">Kiểm tra đúng tên và lớp trước khi bắt đầu. Bài được lưu riêng cho em trên máy này và đồng bộ cho cô khi có mạng.</p>
    {previous && <p role="status" className="mt-3 rounded-xl bg-primary/5 p-3 text-sm font-bold">{previous.submitted ? 'Có bài đã nộp của em trên máy này.' : `Có bài đang làm: đã trả lời ${previous.answered} câu. Em có thể tiếp tục.`}</p>}
    {hasUnnamed && !previous && <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" checked={resumeUnnamed} onChange={e => setResumeUnnamed(e.target.checked)} className="mt-1" /><span>Tiếp tục bài cũ chưa ghi tên trên máy này. Chỉ chọn nếu đó là bài của em.</span></label>}
    <button type="submit" disabled={!validIdentity(identity)} className="mt-5 min-h-11 w-full rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-50">{previous?.submitted ? 'Xem bài đã nộp' : previous || resumeUnnamed ? 'Tiếp tục làm bài' : 'Bắt đầu làm bài'}</button>
  </form>;
}
