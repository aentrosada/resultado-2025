export interface ReportCardData {
  naturalSciences: number | null;
  humanSciences: number | null;
  languages: number | null;
  mathematics: number | null;
  essay: number | null;
  studentName?: string;
  certifyingInstitution?: string;
  history?: string; // campo para armazenar a instituição certificadora encontrada (HISTÓRIO)
  isPassing?: boolean;
}

export type AppStep = 'form' | 'analyzing' | 'review' | 'success';