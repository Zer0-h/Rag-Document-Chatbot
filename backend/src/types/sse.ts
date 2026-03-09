export interface SSEChunkEvent {
    type: 'chunk';
    text: string;
}

export interface SSEDoneEvent {
    type: 'done';
    answer: string;
    sources: string[];
}

export interface SSEErrorEvent {
    type: 'error';
    message: string;
}

export type SSEEvent = SSEChunkEvent | SSEDoneEvent | SSEErrorEvent;
