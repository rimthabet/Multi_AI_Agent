import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environment/environment';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json; charset=UTF-8',
    'Accept': 'application/json; charset=UTF-8'
  }),
};

@Injectable({
  providedIn: 'root'
})
export class LitigationService {

  private readonly _httpClient = inject(HttpClient)

  /// Entites
  findEntites() {
    let url = environment.lmsApiUrl + '/entites';
    return this._httpClient.get(url);
  }

  /// 
  findTypeEntites() {
    let url = environment.lmsApiUrl + '/entites/types';
    return this._httpClient.get(url);
  }

  /// Avocats
  findLawyers() {
    let url = environment.lmsApiUrl + '/avocats';
    return this._httpClient.get(url);
  }

  /// Dossiers
  findDossiers() {
    let url = environment.lmsApiUrl + '/dossiers';
    return this._httpClient.get(url, { headers: { 'Content-Type': 'text/plain' } });
  }

  /// Save dossier
  saveDossier(dossier: any) {
    let url = environment.lmsApiUrl + '/dossiers';
    return this._httpClient.post(url, dossier, httpOptions);
  }

  getStatutOptions() {
    let url = environment.lmsApiUrl + '/dossiers/statuts';
    return this._httpClient.get(url);
  }

  getTypeContentieuxOptions() {
    let url = environment.lmsApiUrl + '/dossiers/type-contentieux';
    return this._httpClient.get(url);
  }


  /// Audiences

  findAudiences() {
    let url = environment.lmsApiUrl + '/audiences';
    return this._httpClient.get(url);
  }


}
