# Claude AI 협업 개발 방식

PickMind는 처음부터 끝까지 **Claude Code (Anthropic)** 를 개발 파트너로 삼아 설계·구현·문서화를 진행한 프로젝트입니다. 단순히 코드 자동완성 수준이 아니라, AI와 대화하며 아키텍처를 결정하고 코드를 반복적으로 개선하는 방식으로 개발했습니다.

---

## CLAUDE.md — AI에게 프로젝트 컨텍스트 주입

AI가 매 대화마다 프로젝트를 처음부터 파악하지 않아도 되도록, `CLAUDE.md` 파일에 핵심 규칙·아키텍처·참조 문서를 정의했습니다.

```markdown
## Architecture
PickMind/
  apps/
    api/    NestJS 10 백엔드  → localhost:3001
    web/    Next.js 15 프론트 → localhost:3000
  packages/
    shared/ 공통 타입 · 점수 계산 · 리포트 로직 (@pick-mind/shared)

## Reference Docs — Lazy Load
| 상황                              | 읽을 파일              |
|-----------------------------------|------------------------|
| API 엔드포인트 확인 또는 변경      | docs/api-spec.md       |
| DB 테이블·컬럼·관계 확인 또는 변경 | docs/dbschema.md       |
| 네이밍·파일구조·Git 규칙 확인      | docs/conventions.md    |
```

이 구조 덕분에 AI는 프로젝트 기초 파악 없이 바로 실무 작업에 투입됩니다.

---

## AI가 실제로 기여한 영역

### 1. 아키텍처 설계 — 공통 패키지 분리

초기에는 점수 계산 로직을 백엔드에만 두려 했으나, AI와 논의 끝에 `@pick-mind/shared`로 분리했습니다.

> "점수 계산과 리포트 생성 로직이 프론트·백엔드 모두 필요할 수 있습니다. 모노레포 shared 패키지로 분리하면 중복을 제거하고 타입도 공유됩니다."

결과적으로 `computeScoresFromAnswers`, `buildReport`, 모든 공통 타입이 `packages/shared`에 위치하게 되었고, 양쪽이 동일한 로직을 보장합니다.

### 2. DB 설계 — 그림 옵션 데이터 위치 결정

그림 옵션 데이터(300+ 항목)를 DB에 넣을지 정적 파일로 관리할지 결정해야 했습니다.

> "그림 옵션은 런타임에 변경되지 않는 설정 데이터입니다. TypeScript 정적 파일로 관리하면 타입 안전성과 빌드 타임 검증이 가능합니다. DB에 넣으면 조회·마이그레이션·시딩 복잡도가 늘어납니다."

이 결정으로 DB seed 불필요, 타입 자동완성 완벽 지원, Excel→코드 자동 생성 스크립트까지 구현했습니다.

### 3. 문서 동기화 자동화

`CLAUDE.md`에 "코드 변경 시 관련 문서도 함께 업데이트" 규칙을 명시했습니다.

```markdown
## 문서 동기화 규칙 (필수)
- Controller / DTO / Service에서 엔드포인트를 추가·수정·삭제할 때
  → docs/api-spec.md를 코드 변경과 동시에 업데이트한다.
- prisma/schema.prisma를 변경할 때
  → docs/dbschema.md를 코드 변경과 동시에 업데이트한다.
```

이 규칙으로 API 문서와 DB 스키마 문서가 코드와 항상 동기화됩니다.

### 4. 코드 생성 자동화 — Excel → TypeScript

심리 전문가가 작성한 Excel(300+ 그림 옵션 데이터)을 TypeScript 코드로 변환하는 스크립트를 AI와 함께 설계·구현했습니다. 데이터 변경 시 `npm run sync:drawing-options`로 재생성합니다.

### 5. 이 포트폴리오 레포 자동 동기화

PickMind private 레포에 커밋이 발생하면, GitHub Actions가 자동으로 이 포트폴리오 레포의 코드 스니펫을 업데이트합니다.

---

## AI 협업의 핵심 원칙

1. **컨텍스트를 파일로 관리** — 대화가 끊겨도 `CLAUDE.md`로 즉시 복원
2. **결정 이유를 AI에게 설명** — AI가 더 나은 대안을 제안할 여지를 준다
3. **AI 제안을 검증하고 선택** — AI가 모든 걸 결정하는 게 아니라 개발자가 최종 판단
4. **반복적으로 개선** — 첫 구현 후 AI와 함께 리팩토링·테스트·문서화 진행

---