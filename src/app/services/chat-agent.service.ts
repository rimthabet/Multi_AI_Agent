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

  private _handleNavigation(answer: string): void {
    try {
      const action: NavigationAction = JSON.parse(answer);

      switch (action.action) {

        case 'navigate':
          if (action.route) {
            // Découpe la route en segments pour Angular Router
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