/**
 * 규칙 기반 심리 리포트 생성 — @pick-mind/shared
 *
 * 5가지 점수(0–100)를 HIGH(≥60) / LOW(≤40) 임계값으로 분류해
 * 개인화된 심리 해석 텍스트를 생성합니다.
 * AI 없이 규칙 기반으로 동작하므로 응답이 빠르고 비용이 없습니다.
 */

const HIGH = 60;
const LOW  = 40;

export function buildReport(scores: Scores): ReportResult {
  const lines:      string[] = [];
  const highlights: string[] = [];

  if (scores.stability >= HIGH) {
    lines.push('안정감과 보호받는 느낌을 중요하게 여기는 성향이 드러납니다.');
    highlights.push('안정감을 중요하게 여기는');
  } else if (scores.stability <= LOW) {
    lines.push('정해진 틀보다 변화와 새로운 자극에 비교적 열려 있는 편입니다.');
    highlights.push('변화에 열려 있는');
  }

  if (scores.openness >= HIGH) {
    lines.push('새로운 경험과 관점을 적극적으로 받아들이는 개방적인 태도가 보입니다.');
    highlights.push('개방적인');
  } else if (scores.openness <= LOW) {
    lines.push('판단과 선택에 있어 신중하게 접근하며, 충분히 살펴본 뒤 움직이는 편입니다.');
    highlights.push('신중한');
  }

  if (scores.relationship >= HIGH) {
    lines.push('사람들과의 연결과 교류를 중요하게 여기며, 관계 속에서 에너지를 얻는 경향이 있습니다.');
    highlights.push('관계를 소중히 여기는');
  } else if (scores.relationship <= LOW) {
    lines.push('관계를 맺을 때 다소 조심스럽고, 자신만의 거리감을 지키려는 모습이 있습니다.');
    highlights.push('조심스럽게 관계를 맺는');
  }

  if (scores.selfExpression >= HIGH) {
    lines.push('자신의 생각과 감정을 솔직하게 표현하는 데 익숙한 편입니다.');
    highlights.push('자기표현이 분명한');
  } else if (scores.selfExpression <= LOW) {
    lines.push('감정이나 생각을 드러내기보다 안으로 간직하는 경향이 있습니다.');
  }

  if (scores.stress >= HIGH) {
    lines.push('최근 긴장이나 피로 신호가 다소 높게 나타납니다. 충분한 휴식과 환기가 도움이 될 수 있습니다.');
    highlights.push('긴장 신호가 보이는');
  } else if (scores.stress <= LOW) {
    lines.push('전반적으로 마음의 여유가 느껴지며, 비교적 안정된 상태로 보입니다.');
  }

  if (lines.length === 0) {
    lines.push('여러 성향이 균형 있게 나타나, 한쪽으로 치우치지 않은 고른 모습을 보입니다.');
  }

  const summary =
    highlights.length > 0
      ? `당신은 ${highlights.slice(0, 3).join(', ')} 성향이 있는 것으로 보입니다.`
      : '당신은 여러 성향이 균형 있게 나타나는 편입니다.';

  return { summary, reportText: lines.join('\n\n') };
}
