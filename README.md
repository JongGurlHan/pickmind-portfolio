# PickMind — 그림으로 읽는 심리 검사 앱

> HTP(집·나무·사람) 심리 검사를 디지털 경험으로 구현한 웹 서비스

마지막 업데이트: 2026년 06월 07일

---

## 프로젝트 소개

심리 상담 현장에서 활용되는 **HTP(House-Tree-Person)** 투사 검사를 인터랙티브한 웹 서비스로 구현했습니다. 집·나무·사람 그림의 세부 요소를 선택하면, 선택 패턴을 분석해 5가지 심리 성향 지표와 개인화된 리포트를 제공합니다.

> 이 레포지토리는 포트폴리오 소개용입니다. 핵심 코드 일부와 아키텍처를 공개합니다.  
> 전체 소스코드는 private 레포에서 관리됩니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 4가지 검사 유형 | 종합 HTP, 집 단독, 나무 단독, 사람 단독 검사 |
| 실시간 그림 미리보기 | 옵션 선택 즉시 그림 업데이트 (투명 PNG 레이어 합성) |
| 심리 점수 계산 | 안정감·개방성·대인관계·자기표현·스트레스 5가지 지표 |
| 규칙 기반 리포트 | 점수 패턴 분석 후 개인화된 심리 해석 텍스트 생성 |
| Google 소셜 로그인 | Google OAuth 2.0 + JWT 인증 |
| 반응형 UI | 모바일 퍼스트 Tailwind CSS 디자인 |

---

## 기술 스택

```
Frontend   Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS
Backend    NestJS 10 · TypeScript · Prisma 6
Database   PostgreSQL 16 (Docker)
공통 패키지  @pick-mind/shared (타입·점수 계산·리포트 로직)
인증       Google OAuth 2.0 · JWT
```

---

## 아키텍처

```
PickMind/ (Turborepo 모노레포)
├── apps/
│   ├── api/          NestJS 10 백엔드  → :3001
│   │   ├── auth/         Google OAuth + JWT 인증
│   │   ├── test-session/ 검사 세션 관리 (생성·답변 저장·완료)
│   │   ├── scoring/      점수 계산 서비스
│   │   └── result/       결과 조회
│   └── web/          Next.js 15 프론트 → :3000
│       ├── app/          App Router 페이지
│       └── components/   그림 미리보기·옵션 선택 UI
└── packages/
    └── shared/       @pick-mind/shared
                      ├── 공통 타입 (AnswerJson, Scores, DrawingTemplate …)
                      ├── 점수 계산 (computeScoresFromAnswers)
                      └── 리포트 생성 (buildReport)
```

**핵심 데이터 흐름:**

```
사용자 옵션 선택
     ↓
answerJson 누적 저장 (PATCH /test-sessions/:id/answers)
     ↓
검사 완료 (POST /test-sessions/:id/complete)
     ↓
computeScoresFromAnswers() → normalizeScores()   ← @pick-mind/shared
     ↓
buildReport(scores)                              ← @pick-mind/shared
     ↓
결과 페이지 (점수 차트 + 리포트 텍스트)
```

---

## 핵심 코드 스니펫

### 점수 계산 엔진

선택한 그림 옵션에 부여된 가중치를 누적한 뒤 0–100 범위로 정규화합니다. 프론트·백엔드 어디서도 같은 로직을 쓸 수 있도록 `@pick-mind/shared`에 위치합니다.

```typescript
/** 선택값 + 옵션별 가중치로 5가지 심리 점수를 계산 */
export function computeScoresFromAnswers(
  answerJson: AnswerJson,
  weightsByKey: (category: DrawingCategory, partType: string, optionKey: string) => Weights | undefined,
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

  return normalizeScores(raw); // base 50 ± raw*6, clamp 0–100
}
```

> 전체 스니펫 → [`snippets/scoring-engine.ts`](snippets/scoring-engine.ts)

### 검사 세션 완료 플로우

```typescript
/** POST /test-sessions/:id/complete — 채점 → 리포트 → 결과 저장 (멱등) */
async complete(id: string) {
  const session = await this.prisma.testSession.findUnique({
    where: { id },
    include: { result: true },
  });
  if (!session) throw new NotFoundException('test session not found');

  // 이미 완료된 세션은 재계산 없이 기존 결과 반환 (idempotent)
  if (session.result) {
    return { resultId: session.result.id, summary: session.result.summary };
  }

  const answerJson = session.answerJson as AnswerJson;
  const scores   = await this.scoring.computeScores(answerJson);
  const { summary, reportText } = buildReport(scores);   // @pick-mind/shared

  const result = await this.prisma.testResult.create({
    data: { sessionId: session.id, scoreJson: scores, summary, reportText },
  });

  await this.prisma.testSession.update({
    where: { id: session.id },
    data: { status: 'COMPLETED', completedAt: new Date() },
  });

  return { resultId: result.id, summary: result.summary, scoreJson: result.scoreJson };
}
```

> 전체 스니펫 → [`snippets/test-session-flow.ts`](snippets/test-session-flow.ts)

---

## Claude AI 활용

이 프로젝트는 **Claude Code (Anthropic)** 를 핵심 개발 파트너로 활용해 설계·구현·문서화 전 과정을 진행했습니다.

→ [AI 협업 개발 방식 상세 보기](docs/ai-development.md)

---

## 개발자

**JongGurlHan** · [GitHub](https://github.com/JongGurlHan)
