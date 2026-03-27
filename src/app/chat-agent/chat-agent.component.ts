import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { MarkdownModule } from 'ngx-markdown';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ChatAgentService } from '../services/chat-agent.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  text: string;
  title?: string;
  meta?: string;
  timestamp?: string;
}

interface ChatDocument {
  id: number;
  title: string;
  path?: string;
  date?: string | null;
  sha256?: string;
}

@Component({
  selector: 'app-chat-agent',
  standalone: true,
  imports: [CommonModule, FormsModule, ClarityModule, CdsModule, MarkdownModule],
  templateUrl: './chat-agent.component.html',
  styleUrl: './chat-agent.component.scss'
})
export class ChatAgentComponent implements OnInit, OnDestroy, AfterViewInit {
  private chatAgentService = inject(ChatAgentService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('chatThread') private chatThread!: ElementRef;
  private scrollObserver?: MutationObserver;

  ///////// CHAT STATE
  chatPanelOpened: boolean = false;
  chatIconSolid: boolean = false;
  chatInput: string = '';
  chatDocSearchQuery: string = '';
  showChatDocResults: boolean = false;
  chatBusy: boolean = false;
  chatError: string = '';
  private chatMessageId = 1;
  private chatSubscription?: Subscription;
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  chatMessages: ChatMessage[] = [
    {
      id: 1,
      role: 'assistant',
      title: 'Bonjour, je suis votre agent IA.',
      text: 'Posez une question ou demandez une action.',
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }
  ];
  chatDocuments: ChatDocument[] = [];
  chatDocumentsLoading: boolean = false;
  chatDocumentsError: string = '';
  chatSelectedDocId?: number;
  chatSelectedDocTitle: string = '';

  // PDF inline viewer
  pdfPanelOpen: boolean = false;
  pdfSafeUrl: SafeResourceUrl | null = null;

  ngOnInit() {
    // Recherche en temps réel avec debounce 300ms
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.loadChatDocuments(query);
    });
  }

  ngAfterViewInit() {
    this.setupScrollObserver();
  }

  ngOnDestroy() {
    this.chatSubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
    this.scrollObserver?.disconnect();
  }

  private setupScrollObserver() {
    if (this.chatThread?.nativeElement) {
      this.scrollObserver = new MutationObserver(() => this.scrollToBottom());
      this.scrollObserver.observe(this.chatThread.nativeElement, {
        childList: true,
        subtree: true,
      });
      this.scrollToBottom();
    }
  }

  scrollToBottom(): void {
    try {
      if (this.chatThread?.nativeElement) {
        this.chatThread.nativeElement.scrollTop = this.chatThread.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  // Appelé à chaque frappe dans la barre de recherche
  onSearchInput(query: string): void {
    this.searchSubject.next(query);
  }

  // Réinitialiser la sélection du document
  clearDocumentSelection(): void {
    this.chatSelectedDocId = undefined;
    this.chatSelectedDocTitle = '';
    this.pdfPanelOpen = false;
    this.pdfSafeUrl = null;
  }

  viewSelectedPdf() {
    if (!this.chatSelectedDocId) return;
    const url = `/chatAgent/documents/view/${this.chatSelectedDocId}`;
    this.pdfSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.pdfPanelOpen = true;
  }

  closePdfPanel(): void {
    this.pdfPanelOpen = false;
    this.pdfSafeUrl = null;
  }

  applyQuickPrompt(prompt: string) {
    this.chatInput = prompt;
  }

  openChatPanel(): void {
    this.chatPanelOpened = true;
    if (!this.chatDocuments.length) {
      this.loadChatDocuments();
    }
  }

  loadChatDocuments(query: string = ''): void {
    this.chatDocumentsLoading = true;
    this.chatDocumentsError = '';
    this.chatAgentService.listDocuments(query).subscribe({
      next: (docs) => {
        this.chatDocuments = docs || [];
        this.chatDocumentsLoading = false;
      },
      error: () => {
        this.chatDocumentsLoading = false;
        this.chatDocumentsError = 'Impossible de charger les documents.';
      }
    });
  }

  onChatDocumentChange(docId: string): void {
    const id = Number(docId);
    const doc = this.chatDocuments.find(item => item.id === id);
    if (doc) {
      this.chatSelectedDocId = doc.id;
      this.chatSelectedDocTitle = doc.title;
    } else {
      this.chatSelectedDocId = undefined;
      this.chatSelectedDocTitle = '';
    }
  }

  onChatKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!this.chatBusy && this.chatInput.trim()) {
        this.sendChatMessage();
      }
    }
  }

  sendChatMessage() {
    const question = this.chatInput.trim();
    if (!question || this.chatBusy) return;

    let payloadQuestion = question;
    let docTitle = this.chatSelectedDocTitle;
    let docSha256 = undefined;
    if (this.chatSelectedDocId) {
      const doc = this.chatDocuments.find(item => item.id === this.chatSelectedDocId);
      if (doc && (doc as any).sha256) {
        docSha256 = (doc as any).sha256;
      }
    }
    if (docTitle && !docTitle.toLowerCase().endsWith('.pdf')) {
      docTitle = docTitle + '.pdf';
    }
    if (docSha256 && !question.toLowerCase().includes('sha256')) {
      payloadQuestion = `[SHA256:${docSha256}] Dans le document "${docTitle}" : ${question}`;
    } else if (docTitle) {
      payloadQuestion = `Dans le document "${docTitle}" : ${question}`;
    }

    this.chatBusy = true;
    this.chatError = '';
    this.chatSubscription?.unsubscribe();
    const sendTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    this.addChatMessage({
      id: this.nextChatMessageId(),
      role: 'user',
      text: question,
      timestamp: sendTime
    });
    this.chatInput = '';

    this.chatSubscription = this.chatAgentService.ask(payloadQuestion).subscribe({
      next: (response) => {
        // ── Agent Navigation ──────────────────────────────────────────
        if (response?.agent === 'navigation') {
          try {
            const action = JSON.parse(response.answer);

            if (action.action === 'navigate' && action.route) {
              const segments = action.route.split('/');
              this.router.navigate(segments, { queryParams: action.params || {} });

              const navTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              this.addChatMessage({
                id: this.nextChatMessageId(),
                role: 'assistant',
                text: `✓ ${action.label || 'Navigation effectuée'}`,
                meta: 'Agent: navigation',
                timestamp: navTime
              });

            } else if (action.action === 'error' || action.action === 'unknown') {
              const errNavTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              this.addChatMessage({
                id: this.nextChatMessageId(),
                role: 'assistant',
                text: action.message || 'Action non reconnue.',
                meta: 'Agent: navigation',
                timestamp: errNavTime
              });
            }

          } catch (e) {
            const catchTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            this.addChatMessage({
              id: this.nextChatMessageId(),
              role: 'assistant',
              text: response.answer,
              meta: 'Agent: navigation',
              timestamp: catchTime
            });
          }

        // ── Agents Données / Documents ────────────────────────────────
        } else {
          const answer = response?.answer?.trim() || 'Je n\'ai pas de réponse pour le moment.';
          const meta = response?.agent ? `Agent: ${response.agent}` : undefined;
          const respTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          this.addChatMessage({
            id: this.nextChatMessageId(),
            role: 'assistant',
            text: answer,
            meta: meta,
            timestamp: respTime
          });
        }

        this.chatBusy = false;
        this.chatSubscription = undefined;
      },
      error: (error) => {
        this.chatBusy = false;
        this.chatSubscription = undefined;
        this.chatError = 'Impossible de joindre l\'agent IA pour le moment.';
      }
    });
  }

  cancelChatRequest(): void {
    if (!this.chatBusy) {
      return;
    }
    this.chatSubscription?.unsubscribe();
    this.chatSubscription = undefined;
    this.chatBusy = false;
    this.chatError = '';
    const cancelTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    this.addChatMessage({
      id: this.nextChatMessageId(),
      role: 'assistant',
      text: 'Réponse annulée.',
      meta: 'Agent: system',
      timestamp: cancelTime
    });
  }

  private addChatMessage(message: ChatMessage) {
    this.chatMessages = [...this.chatMessages, message];
  }

  private nextChatMessageId(): number {
    this.chatMessageId += 1;
    return this.chatMessageId;
  }
}
