import { collection, getDocs, limit, query, startAfter, where, type QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { leaderboardEntrySchema, type LeaderboardRecord } from './examLeaderboard';

export async function loadExamLeaderboard(grade: number): Promise<LeaderboardRecord[]> {
  const rows: LeaderboardRecord[] = [];
  let cursor: QueryDocumentSnapshot | undefined;
  // Read every page before ranking: a query limit must never silently exclude older pupils.
  for (;;) {
    const page = await getDocs(query(collection(db, 'exam_leaderboard'), where('grade', '==', grade), ...(cursor ? [startAfter(cursor)] : []), limit(500)));
    for (const item of page.docs) {
      const parsed = leaderboardEntrySchema.safeParse(item.data());
      if (parsed.success) rows.push({ ...parsed.data, id: item.id });
    }
    if (page.size < 500) return rows;
    cursor = page.docs.at(-1);
  }
}
