import Langfuse from 'langfuse';

const GEMINI_FLASH_INPUT_COST_PER_1M = 0.075;
const GEMINI_FLASH_OUTPUT_COST_PER_1M = 0.30;

let client: Langfuse | null = null;

function getClient(): Langfuse {
    if (!client) {
        client = new Langfuse({
            publicKey: process.env.LANGFUSE_PUBLIC_KEY,
            secretKey: process.env.LANGFUSE_SECRET_KEY,
            baseUrl: process.env.LANGFUSE_BASE_URL,
        });
    }
    return client;
}

export function createTrace(question: string, sessionId: string) {
    const lf = getClient();
    const trace = lf.trace({
        name: 'ask',
        input: { question },
        sessionId,
        metadata: { sessionId },
    });
    return trace;
}

export function spanEmbed(trace: ReturnType<Langfuse['trace']>, input: string) {
    const start = Date.now();
    const span = trace.span({ name: 'embed', input: { text: input } });

    return {
        end(embedding: number[]) {
            span.end({
                output: { dimensions: embedding.length },
                metadata: { latencyMs: Date.now() - start },
            });
        },
        endWithError(err: string) {
            span.end({ metadata: { error: err, latencyMs: Date.now() - start } });
        },
    };
}

export function spanRetrieve(trace: ReturnType<Langfuse['trace']>, topK: number) {
    const start = Date.now();
    const span = trace.span({ name: 'retrieve', input: { topK } });

    return {
        end(chunks: Array<{ source: string; heading: string; content: string }>) {
            span.end({
                output: {
                    count: chunks.length,
                    sources: [...new Set(chunks.map(c => c.source))],
                    chunks: chunks.map(c => ({ source: c.source, heading: c.heading, preview: c.content.slice(0, 120) })),
                },
                metadata: { latencyMs: Date.now() - start },
            });
        },
    };
}

export function spanGenerate(trace: ReturnType<Langfuse['trace']>, question: string, context: string) {
    const start = Date.now();
    const inputTokens = Math.ceil((context.length + question.length) / 4);
    const generation = trace.generation({
        name: 'generate',
        model: 'gemini-3.1-flash-lite-preview',
        input: [
            { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` },
        ],
        usage: { input: inputTokens },
    });

    return {
        end(answer: string) {
            const outputTokens = Math.ceil(answer.length / 4);
            const cost =
                (inputTokens / 1_000_000) * GEMINI_FLASH_INPUT_COST_PER_1M +
                (outputTokens / 1_000_000) * GEMINI_FLASH_OUTPUT_COST_PER_1M;

            generation.end({
                output: answer,
                usage: {
                    input: inputTokens,
                    output: outputTokens,
                    total: inputTokens + outputTokens,
                    unit: 'TOKENS',
                },
                metadata: {
                    latencyMs: Date.now() - start,
                    estimatedCostUsd: parseFloat(cost.toFixed(6)),
                },
            });
        },
        endWithError(err: string) {
            generation.end({ metadata: { error: err, latencyMs: Date.now() - start } });
        },
    };
}

export async function flushAsync(): Promise<void> {
    await client?.flushAsync();
}