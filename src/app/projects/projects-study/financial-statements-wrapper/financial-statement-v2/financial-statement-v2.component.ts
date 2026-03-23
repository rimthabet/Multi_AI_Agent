import { Component, inject, input, effect } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { FinStatementService } from '../../../../services/fin-statement.service';
import { FinancialDatumComponent } from "./financial-datum/financial-datum.component";

@Component({
  selector: 'financial-statement-v2',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    FinancialDatumComponent
  ],
  templateUrl: './financial-statement-v2.component.html',
  styleUrl: './financial-statement-v2.component.scss'
})
export class FinancialStatementV2Component {

  private readonly finStatementService = inject(FinStatementService);

  data = input<any>();
  prospection = input<any>();
  ref2 = input<number>(-1);
  ref3 = input<number>(-1);
  ref4 = input<number>(-1);
  ref5 = input<number>(-1);
  item = input<any>();
  year = input<number>(new Date().getFullYear());
  years = input<number>(-1);
  columns = input<number>(5);

  financial_statement_items: any[] = [];
  financial_statement_data: Map<string, any> | undefined;
  financial_statement_codes: string[] = [];

  loading: boolean = false;

  // loadData effect, deprecated
  loadData = effect(() => {

    if (!this.item()) return;
    const dataToUse = this.data();
    if (!dataToUse) return;

    this.financial_statement_codes = dataToUse.filter((item: any) => item.code.split('.')[0] == this.item().code).map((item: any) => item.code);

    this.financial_statement_items = dataToUse.filter(
      (item: any) =>
        item.code.split('.').length == 2 &&
        item.code.split('.')[0] == this.item().code
    );

    this.financial_statement_items?.forEach((item: any) => {
      item.items = dataToUse.filter(
        (it: any) =>
          it.code.startsWith(item.code) && it.code.split('.').length == 3
      );
      item.items.forEach((it: any) => {
        it.items = dataToUse.filter(
          (i: any) =>
            i.code.startsWith(it.code) && i.code.split('.').length == 4
        );
        it.items.forEach((i: any) => {
          i.items = dataToUse.filter(
            (j: any) =>
              j.code.startsWith(i.code) && j.code.split('.').length == 5
          );
        });
      });
    });

    // We will help with the caching for the sake of acceleration
    const data = sessionStorage.getItem('financial_statement_data_' + this.prospection().id + "_" + this.item().code);
    console.log("Cached data", data);
    if (data) {
      this.financial_statement_data = new Map(JSON.parse(data).map((item: any) => [item.entity.code + '|' + item.year, item]));
    } else {
      this.loadFinancialStatementData();
    }
  });


  // Load Financial Statement Data
  loadFinancialStatementData() {

    this.loading = true;

    if (this)
      this.finStatementService.fetchFinancialStatementData(
        this.financial_statement_codes,
        this.prospection().id,
        this.ref2(),
        this.ref3(),
        this.ref4(),
        this.ref5(),
        this.year(),
        this.years(),
        -1,
        false
      ).subscribe({
        next: (data: any) => {

          this.financial_statement_data = new Map(data.map((item: any) => [item.entity.code + '|' + item.year, item]));
          sessionStorage.setItem('financial_statement_data_' + this.prospection().id + "_" + this.item().code, JSON.stringify(data));
        },
        complete: () => this.loading = false
      })
  }


  //raise save event
  raiseSaveEvent(year: any) {
    if (year) this.finStatementService.raiseSaveEvent(year);
    this.finStatementService.raiseSaveEvent(this.year ?? 0);
  }

  //raise refresh event
  raiseRefreshEvent(year: any) {
    if (year) this.finStatementService.raiseRefreshEvent(year);
    this.finStatementService.raiseRefreshEvent(this.year ?? 0);
  }

  // Helper methods for template calculations
  getColumnsPlus4(): number {
    return (this.columns() ?? 0) + 4;
  }

  getColumnsPlus3(): number {
    return (this.columns() ?? 0) + 3;
  }

  getColumnsPlus2(): number {
    return (this.columns() ?? 0) + 2;
  }

  getYearMinusColumnsPlus(index: number): number {
    return (this.year() ?? 0) - (this.columns() ?? 0) + index + 1;
  }


  fetchFinDatum(item: any, year: number): any {
    return this.financial_statement_data?.get(item.code + '|' + year);
  }
}