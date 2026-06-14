

## Critical Rules (절대 규칙)

- 프로덕션 DB에 직접 쿼리 금지 
- .env, credentials.json 등 시크릿 파일 절대 커밋 금지

## 작업 방식

### Think Before Coding
가정은 명시적으로 서술한다. 불확실하면 먼저 묻는다. 두 해석 사이에서 침묵으로 선택하지 말고 선택지를 제시한다. 더 단순한 대안이 보이면 즉시 드러낸다.

### Simplicity First
문제를 푸는 **최소한의 코드**만 작성한다. 요청받지 않은 기능·추상화·방어 로직은 추가하지 않는다.  
리트머스 테스트: 200줄이 50줄로 줄 수 있다면 다시 쓴다. 시니어 엔지니어가 "과설계"라고 부를 코드는 쓰지 않는다.

### Surgical Changes
기존 코드를 수정할 때는 **반드시 필요한 부분만** 건드린다. 인접 코드의 스타일을 보존하고, 작동 중인 컴포넌트는 리팩터링하지 않는다. **내 변경으로 생긴** 미사용 import·변수만 제거한다—기존 dead code는 명시적 요청 없이 손대지 않는다.

### Goal-Driven Execution
모호한 요청은 측정 가능한 목표와 검증 단계로 전환한다.  
예: "검증 추가" → "잘못된 입력에 대한 테스트 작성 → 통과시키기".  
다단계 작업은 단계와 검증 체크리스트를 간략히 나열하고 독립적으로 진행한다.



## Architecture (아키텍처)

모노레포 구조

```
PickMind/
  apps/
    api/    NestJS 10 백엔드  → localhost:3001
    web/    Next.js 15 프론트 → localhost:3000
  packages/
    shared/ 공통 타입 · 점수 계산 · 리포트 로직 (@pick-mind/shared)
  docker-compose.yml
```

1## Tech Stack (기술 스택)

Frontend: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
Backend:  NestJS 10, TypeScript, Prisma 6 |
DB:  PostgreSQL 16 (Docker) |
공통: `@pick-mind/shared` (타입 · 점수 계산 · 리포트 로직)


## Reference Docs (참조 문서) — Lazy Load

아래 문서는 필요할 때만 읽는다. 항상 로드하지 말 것.

| 상황 | 읽을 파일 |
|---|---|
| API 엔드포인트·요청·응답 스펙 확인 또는 변경 | `docs/api-spec.md` |
| DB 테이블·컬럼·관계·인덱스 확인 또는 변경 | `docs/dbschema.md` |
| 네이밍·파일구조·Git·테스트 규칙 확인 | `docs/conventions.md` |

### 문서 동기화 규칙 (필수)

- **Controller / DTO / Service에서 엔드포인트를 추가·수정·삭제할 때**  
  → `docs/api-spec.md`를 코드 변경과 동시에 업데이트한다.

- **`apps/api/prisma/schema.prisma`를 변경할 때**  
  → `docs/dbschema.md`를 코드 변경과 동시에 업데이트한다.

- **컨벤션(네이밍·구조·Git 정책 등)이 바뀔 때**  
  → `docs/conventions.md`를 업데이트한다.