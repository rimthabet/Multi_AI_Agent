import { HttpHeaders, HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment/environment';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json; charset=UTF-8',
  }),
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly _httpClient = inject(HttpClient);

  getRealmId() {
    return this._httpClient.post(environment.keycloakConfigUrl, {}, httpOptions);
  }
}