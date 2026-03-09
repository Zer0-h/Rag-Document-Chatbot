
export interface DocRecord extends Record<string, unknown> {
    id: string;
    source: string;
    heading: string;
    content: string;
    vector: number[];
}
