import { Component, Input } from '@angular/core';
import { MarkdownPipe } from '../../pipes/markdown.pipe';
import { ChatMessage } from '../../models/chat-message';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [MarkdownPipe],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss',
})
export class MessageComponent {
  @Input({ required: true }) message!: ChatMessage;
}