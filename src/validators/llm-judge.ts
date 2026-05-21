import OpenAI from 'openai';
import { QueryExpect } from '../utils/test-data';

export interface JudgeResult {
  score: number;
  hallucination: boolean;
  onTopic: boolean;
  helpful: boolean;
  reasoning: string;
}

export function isLlmJudgeEnabled(): boolean {
  return (
    (process.env.USE_LLM_JUDGE === 'true' || process.env.USE_LLM_JUDGE === '1') &&
    !!process.env.OPENAI_API_KEY
  );
}

export class LlmJudge {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async evaluate(
    userPrompt: string,
    assistantResponse: string,
    expect?: QueryExpect,
  ): Promise<JudgeResult> {
    const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
    const topics = expect?.topics?.join(', ') ?? 'UAE public services';

    const completion = await this.client.chat.completions.create({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You evaluate UAE Government chatbot (U-Ask) answers. Return JSON only:
{ "score": 1-5, "hallucination": boolean, "onTopic": boolean, "helpful": boolean, "reasoning": "brief" }
- hallucination=true if the answer invents laws, fees, phone numbers, or URLs not plausibly official.
- onTopic=true if about UAE government services related to: ${topics}.
- helpful=true if actionable and clear.`,
        },
        {
          role: 'user',
          content: `User: ${userPrompt}\n\nAssistant: ${assistantResponse}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as JudgeResult;
    return {
      score: Number(parsed.score) || 1,
      hallucination: !!parsed.hallucination,
      onTopic: !!parsed.onTopic,
      helpful: !!parsed.helpful,
      reasoning: parsed.reasoning ?? '',
    };
  }
}
