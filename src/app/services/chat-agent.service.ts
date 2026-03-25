import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface ChatAgentResponse {
  answer: string;
  agent?: string;
}

export interface NavigationAction {
  action: 'navigate' | 'error' | 'unknown';
  route?: string;
  label?: string;
  message?: string;
  params?: Record<string, any>;
}

export interface ChatDocument {
  id: number;
  title: string;
  path?: string;
  date?: string | null;
  sha256?: string;
}

export interface UploadDocumentResponse {
  id: number;
  title: string;
  filename: string;
  path: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatAgentService {
  private readonly httpClient = inject(HttpClient);
  private readonly router     = inject(Router);
  private readonly baseUrl    = '/chatAgent';

  ask(question: string): Observable<ChatAgentResponse> {
    return this.httpClient.post<ChatAgentResponse>(
      `${this.baseUrl}/agents/ask`,
      { question }
    ).pipe(
      tap(response => {
        if (response.agent === 'navigation') {
          this._handleNavigation(response.answer);
        }
      })
    );
  }

  listDocuments(query: string = ''): Observable<ChatDocument[]> {
    const url = query.trim()
      ? `${this.baseUrl}/documents/list?q=${encodeURIComponent(query.trim())}`
      : `${this.baseUrl}/documents/list`;
    return this.httpClient.get<ChatDocument[]>(url);
  }

  uploadDocument(file: File, title?: string): Observable<UploadDocumentResponse> {
    const form = new FormData();
    form.set('file', file);
    if (title) {
      form.set('title', title);
    }
    return this.httpClient.post<UploadDocumentResponse>(
      `${this.baseUrl}/documents/upload`,
      form
    );
  }

  private _handleNavigation(answer: string): void {
    try {
      const action: NavigationAction = JSON.parse(answer);

      switch (action.action) {

        case 'navigate':
          if (action.route) {
            const segments = action.route.split('/');
            this.router.navigate(segments, { queryParams: action.params || {} });
          }
          break;

        case 'error':
        case 'unknown':
          break;
      }

    } catch (e) {
    }
  }

  isNavigationResponse(response: ChatAgentResponse): boolean {
    return response.agent === 'navigation';
  }

  getNavigationAction(answer: string): NavigationAction | null {
    try {
      return JSON.parse(answer) as NavigationAction;
    } catch {
      return null;
    }
  }
}