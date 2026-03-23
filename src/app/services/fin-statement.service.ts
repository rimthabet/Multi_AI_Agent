import { HttpHeaders, HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environment/environment';

@Injectable({
    providedIn: 'root',
})
export class FinStatementService {


    // @GetMapping("/{ref1}/{ref2}/{entity_id}/{year}/{years}/{row}/{persistent}")

    private readonly _httpClient = inject(HttpClient);

    private readonly httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json; charset=UTF-8',
        }),
    };

    // Last Upatde Entity
    private readonly _updatedEntity = new BehaviorSubject('');
    updatedEntity = this._updatedEntity.asObservable();

    setUpdatedEntity(entity: any) {
        this._updatedEntity.next(entity);
    }

    // Save Event Management, for formula items by year
    private readonly _saveEvent = new BehaviorSubject(0);
    saveEvent = this._saveEvent.asObservable();
    raiseSaveEvent(year: any) {
        this._saveEvent.next(year);
    }

    // Refresh Event Management, with latest formula for the year
    private readonly _refreshEvent = new BehaviorSubject(0);
    refreshEvent = this._refreshEvent.asObservable();
    raiseRefreshEvent(year: any) {
        this._refreshEvent.next(year);
    }

    /// Entities management
    fetchEntities(code?: any) {
        let url = environment.finStatementUrl + (code ? '/entity/' + code : '/entity/list');
        return this._httpClient.get(url);
    }

    fetchEntitiesByBP(bpId: any) {
        let url = environment.finStatementUrl + '/entity/bp/' + bpId;
        return this._httpClient.get(url);
    }

    fetchEntitiesByCBR(projetId: any, bpId: any, code: any) {
        let url = environment.finStatementUrl + '/datum/suivi/' + projetId + '/' + bpId + '/' + code;
        return this._httpClient.get(url);
    }

    saveEntity(entity: any) {
        if (entity.id) {
            return this.updateEntity(entity);
        } else {
            let url = environment.finStatementUrl + '/entity';
            return this._httpClient.post(url, entity);
        }
    }

    updateEntity(entity: any) {
        let url = environment.finStatementUrl + '/entity';
        return this._httpClient.put(url, entity);
    }

    deleteEntity(entity: any) {
        let url = environment.finStatementUrl + '/entity/' + entity.id;
        return this._httpClient.delete(url, { responseType: 'text' });
    }

    fetchDatum1(ref: any, entity: any, year: any) {
        let url =
            environment.finStatementUrl +
            '/datum/' +
            ref +
            '/' +
            entity.id +
            '/' +
            year;
        return this._httpClient.get(url);
    }

    fetchDatum2(
        ref1: any,
        ref2: any,
        entity: any,
        year: any,
        years: any,
        row: any,
        persistent: boolean
    ) {
        let url =
            environment.finStatementUrl +
            '/datum/' +
            ref1 +
            '/' +
            ref2 +
            '/' +
            entity.id +
            '/' +
            year +
            '/' +
            years +
            '/' +
            row +
            '/' +
            persistent;

        return this._httpClient.get(url);
    }

    fetchDatumHistory(
        ref1: any,
        ref2: any,
        entity: any,
        count: any,
        year: any,
        years: any,
        persistent: boolean
    ) {
        let url =
            environment.finStatementUrl +
            '/datum/histo/' +
            count +
            '/' +
            ref1 +
            '/' +
            ref2 +
            '/' +
            entity.id +
            '/' +
            year +
            '/' +
            years +
            '/' +
            persistent;

        return this._httpClient.get(url);
    }

    // Load all the financial statement data, to avoid per item download that can make a storm of requests
    fetchFinancialStatementData(items: any[], ref1: number, ref2: number, ref3: number, ref4: number, ref5: number, year: number, years: number, row: number, persistent: boolean) {

        const record = {
            items: items,
            ref1: ref1,
            ref2: ref2,
            ref3: ref3,
            ref4: ref4,
            ref5: ref5,
            year: year,
            years: years,
            persistent: persistent
        };

        let url = environment.finStatementUrl + '/datum/fin-statement-data';
        return this._httpClient.post(url, record);
    }

    saveDatum(datum: any) {
        let url = environment.finStatementUrl + '/datum';
        return this._httpClient.post(url, datum);
    }

    deleteDatum(datum: any) {
        let url = environment.finStatementUrl + '/datum/' + datum.id;
        return this._httpClient.delete(url);
    }

    addFormula(formula: any) {
        let url = environment.finStatementUrl + '/formula';
        return this._httpClient.post(url, formula);
    }

    addBP(bp: any) {
        let url = environment.finStatementUrl + '/bp';
        return this._httpClient.post(url, bp, this.httpOptions);
    }

    deleteBP(bp: any) {
        let url = environment.finStatementUrl + '/bp/' + bp.id;
        return this._httpClient.delete(url);
    }

    fetchBPs(ref: any) {
        let url = environment.finStatementUrl + '/bp/' + ref + '/list';
        return this._httpClient.get(url);
    }

    fetchResultatNet(ref: any, bp: any) {
        let url =
            environment.finStatementUrl + '/bp/resultat-net/' + ref + '/' + bp;
        return this._httpClient.get(url);
    }

    fetchResultatExplotation(ref: any, bp: any) {
        let url =
            environment.finStatementUrl +
            '/bp/resultat-exploitation/' +
            ref +
            '/' +
            bp;
        return this._httpClient.get(url);
    }

    fetchTriData(bp: any, ref: any, code: any) {
        let url =
            environment.finStatementUrl + '/bp/' + bp + '/' + ref + '/' + code;
        return this._httpClient.get(url);
    }

    /// TRI

    fetchSavedTriCapital(financementId: any) {
        let url =
            environment.finStatementUrl + '/tri/capital/financement/' + financementId;
        return this._httpClient.get(url);
    }
    fetchSavedTriOCA(financementId: any) {
        let url =
            environment.finStatementUrl + '/tri/oca/financement/' + financementId;
        return this._httpClient.get(url);
    }
    calculateTri(params: any) {
        let url = environment.finStatementUrl + '/tri';
        return this._httpClient.post(url, params, this.httpOptions);
    }

    // We need to consider longer codes (so first field in the split with '.'
    sortItems(data: any) {
        data.sort((a: any, b: any) => {
            if (
                a.code.substring(0, 2) != b.code.substring(0, 2) ||
                a.code.length == b.code.length
            ) {
                return a.code > b.code ? 1 : a.code < b.code ? -1 : 0;
            }

            // Here is the same main item but different levels
            let a_digits = a.code.substring(3).split('.');
            let b_digits = b.code.substring(3).split('.');

            for (let i = 0; i < Math.min(a_digits.length, b_digits.length); i++) {
                if (+a_digits[i] > +b_digits[i]) return 1;
                if (+a_digits[i] < +b_digits[i]) return -1;
            }

            return a.code.length > b.code.length
                ? 1
                : a.code.length < b.code.length
                    ? -1
                    : 0;
        });
    }
}
