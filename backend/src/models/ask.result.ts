
export interface AskResult {
    stream: AsyncIterable<string>;
    sources: string[];
}