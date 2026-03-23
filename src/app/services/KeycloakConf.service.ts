import { HttpHeaders, HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root',
})
export class KeycloakConf {

  private readonly _httpClient = inject(HttpClient);

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json; charset=UTF-8',
    }),
  };

  
  getRealmId() {
    return this._httpClient.post(environment.keycloakConfigUrl, {}, this.httpOptions);
  }
}