import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  private readonly _httpClient = inject(HttpClient);
  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json; charset=UTF-8'
    })
  };


  findUser(user: any) {
    return this._httpClient.post(environment.apiUrl + '/users', user, this.httpOptions);
  }

} 
