import { Component, inject, ViewChild, ElementRef, AfterViewChecked, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from './services/chat.service';
import { MessageComponent } from './components/message/message.component';

const SUGGESTIONS = [
  'How do I rotate an API key?',
  'What are the webhook retry policies?',
  'How do I set up OAuth 2.0?',
  'What happens to my data after I cancel?',
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, MessageComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewChecked {
  chat = inject(ChatService);
  suggestions = SUGGESTIONS;
  input = '';

  @ViewChild('bottom') private bottomEl!: ElementRef;
  private shouldScroll = false;

  constructor() {
    effect(() => {
      this.chat.messages();
      this.shouldScroll = true;
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.bottomEl?.nativeElement.scrollIntoView({ behavior: 'smooth' });
      this.shouldScroll = false;
    }
  }

  send(question?: string): void {
    const q = question ?? this.input.trim();
    if (!q) return;
    this.input = '';
    this.chat.sendMessage(q);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  resetSession(): void {
    this.chat.clearSession();
  }

  trackById(_: number, msg: { id: string }): string {
    return msg.id;
  }
}