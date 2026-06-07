/**
 * 점수 계산 핵심 로직 — @pick-mind/shared
 *
 * 사용자가 선택한 그림 옵션의 가중치를 누적한 뒤,
 * 0–100 범위 점수로 정규화합니다.
 * 프론트·백엔드 모두 이 함수를 공유합니다.
 */

export const SCORE_KEYS = [
  'stability',      // 안정감
  'openness',       // 개방성
  'relationship',   // 대인관계 경향
  'selfExpression', // 자기표현
  'stress',         // 스트레스 신호
] as const;

export type ScoreKey = (typeof SCORE_KEYS)[number];
export type Scores   = Record<ScoreKey, number>;
export type Weights  = Partial<Record<ScoreKey, number>>;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** 가중치 합(raw)을 0–100 범위 점수로 정규화 (base 50 ± raw*6) */
export function normalizeScores(raw: Scores): Scores {
  const out = emptyRaw();
  for (const key of SCORE_KEYS) {
    out[key] = clamp(Math.round(50 + (raw[key] ?? 0) * 6), 0, 100);
  }
  return out;
}

/** 선택값 + 옵션별 가중치로부터 5가지 심리 점수를 계산 */
export function computeScoresFromAnswers(
  answerJson: AnswerJson,
  weightsByKey: (
    category: DrawingCategory,
    partType: string,
    optionKey: string,
  ) => Weights | undefined,
): Scores {
  const raw = emptyRaw();

  for (const [categoryLower, parts] of Object.entries(answerJson ?? {})) {
    const category = categoryLower.toUpperCase() as DrawingCategory;
    if (!DRAWING_CATEGORIES.includes(category)) continue;

    for (const [partType, value] of Object.entries(parts ?? {})) {
      if (!value || value.exists === false) continue;
      const optionKey = (value.optionKey ?? value.shapeId) as string | undefined;
      if (!optionKey) continue;

      const weights = weightsByKey(category, partType, optionKey);
      if (!weights) continue;

      for (const key of SCORE_KEYS) {
        const w = weights[key];
        if (typeof w === 'number') raw[key] += w;
      }
    }
  }

  return normalizeScores(raw);
}
