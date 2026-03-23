import { Component, inject, input, effect } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { DataFormComponent } from './data-form/data-form.component';
import { FinStatementService } from '../../../../services/fin-statement.service';

@Component({
  selector: 'financial-statement',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    DataFormComponent
  ],
  templateUrl: './financial-statement.component.html',
  styleUrl: './financial-statement.component.scss'
})
export class FinancialStatementComponent {

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

  tree_data: any[] = [];


  // loadData effect
  loadData = effect(() => {

    if (!this.item()) return;
    const dataToUse = this.data();
    if (!dataToUse) return;

    const financial_statement = [...dataToUse.filter((item: any) => item.code.split('.')[0] == this.item().code)];
    console.log("Financial Items ", financial_statement);


    this.tree_data = dataToUse.filter(
      (item: any) =>
        item.code.split('.').length == 2 &&
        item.code.split('.')[0] == this.item().code
    );


    financial_statement?.forEach((item: any) => {
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
  });


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
}