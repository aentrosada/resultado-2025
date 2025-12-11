export interface ReportCardData {
  naturalSciences: number | null;
  humanSciences: number | null;
  languages: number | null;
  mathematics: number | null;
  essay: number | null;
  studentName?: string;
  isPassing?: boolean;
}

export type AppStep = 'form' | 'analyzing' | 'review' | 'success';