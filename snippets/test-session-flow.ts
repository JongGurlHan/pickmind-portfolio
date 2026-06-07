/**
 * 검사 세션 완료 플로우 — apps/api/src/test-session/test-session.service.ts
 *
 * 검사가 완료되면 채점 → 리포트 생성 → DB 저장을 순서대로 처리합니다.
 * 같은 세션을 중복 완료해도 동일 결과를 반환하는 멱등성(idempotent)을 보장합니다.
 */

@Injectable()
export class TestSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoring: ScoringService,
  ) {}

  /** POST /test-sessions/:id/complete */
  async complete(id: string) {
    const session = await this.prisma.testSession.findUnique({
      where: { id },
      include: { result: true },
    });
    if (!session) throw new NotFoundException('test session not found');

    // 이미 완료된 세션은 재계산 없이 기존 결과 반환 (idempotent)
    if (session.result) {
      return {
        resultId: session.result.id,
        summary:  session.result.summary,
        scoreJson: session.result.scoreJson,
      };
    }

    const answerJson = (session.answerJson ?? {}) as AnswerJson;

    // @pick-mind/shared의 순수 함수로 채점 + 리포트 생성
    const scores = await this.scoring.computeScores(answerJson);
    const { summary, reportText } = buildReport(scores);

    const result = await this.prisma.testResult.create({
      data: {
        sessionId: session.id,
        scoreJson: scores as unknown as Prisma.InputJsonValue,
        summary,
        reportText,
      },
    });

    await this.prisma.testSession.update({
      where: { id: session.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    return {
      resultId:  result.id,
      summary:   result.summary,
      scoreJson: result.scoreJson,
    };
  }
}
