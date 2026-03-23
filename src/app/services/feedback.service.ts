import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface FeedbackInput {
  rate: number;
  comment?: string;
  author: string;
}

export interface Feedback {
  id?: string;
  rate: number;
  comment?: string;
  author: string;
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {

  private readonly feedbackApiUrl = '/fbregistryApi/graphql';
  private readonly API_HEADERS = {
    'X-API-KEY': 'SpYh3qHO2+5SEqOQ4NEWjjZ6Exrl4yxjo9H4ZyOwHVkRnoNHw+qUfh7ribrPsKxF7fGSqPODR8xEV2qoyJt2RYaUQvv2ElUs4/B8Ki5vqjkcnIhPNzrxmERwKb1gxWdvyyTajMtMI7w1+kz6qzfxQR3aQBdqug5TqCPcg/7qXfdsg8kJi8vsjttDEgeYw/tvHJm/TnmZx5ZyOiqpZuNO25+0/qbmje74w/xCm3Kur/dtadDR8J+Uq0OPKbm8TsE87TKZOQUNl7z4IR1tVzz3g3SvYDIdAz9lT30hDWGcayskomZQnrDto8/BEfFU7url'
  };

  constructor(private readonly httpClient: HttpClient) { }

  createFeedback(feedbackInput: FeedbackInput): Observable<any> {
    const mutation = `
      mutation CreateFeedback($input: FeedbackInput!) {
        createFeedback(input: $input) {
          id
          rate
          comment
          author
        }
      }
    `;

    const variables = {
      input: feedbackInput
    };

    const body = {
      query: mutation,
      variables: variables
    };

    return this.httpClient.post<any>(this.feedbackApiUrl, body, { headers: this.API_HEADERS });
  }
}
