import { Injectable, signal } from '@angular/core';
import { ChatMessage } from '../models/chat-message';

const SESSION_ID = crypto.randomUUID();
const API_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private _messages = signal<ChatMessage[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private abortController: AbortController | null = null;

  readonly messages = this._messages.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  async sendMessage(question: string): Promise<void> {
    if (!question.trim() || this._loading()) return;

    this._error.set(null);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
    };

    const assistantId = crypto.randomUUID();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      streaming: true,
    };

    this._messages.update(msgs => [...msgs, userMsg, assistantMsg]);
    this._loading.set(true);
    this.abortController = new AbortController();

    try {
      const response = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, sessionId: SESSION_ID }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error ?? `HTTP ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'chunk') {
              this._messages.update(msgs =>
                msgs.map(m => m.id === assistantId
                  ? { ...m, content: m.content + event.text }
                  : m
                )
              );
            } else if (event.type === 'done') {
              this._messages.update(msgs =>
                msgs.map(m => m.id === assistantId
                  ? { ...m, streaming: false, sources: event.sources }
                  : m
                )
              );
            } else if (event.type === 'error') {
              throw new Error(event.message);
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const message = err instanceof Error ? err.message : 'Something went wrong';
      this._error.set(message);
      this._messages.update(msgs =>
        msgs.map(m => m.id === assistantId
          ? { ...m, content: `Error: ${message}`, streaming: false }
          : m
        )
      );
    } finally {
      this._loading.set(false);
      this._messages.update(msgs =>
        msgs.map(m => m.id === assistantId ? { ...m, streaming: false } : m)
      );
    }
  }

  async clearSession(): Promise<void> {
    try {
      await fetch(`${API_URL}/session/${SESSION_ID}`, { method: 'DELETE' });
    } catch {
      console.error('Failed to clear session on server');
    }
    this._messages.set([]);
    this._error.set(null);
  }
}