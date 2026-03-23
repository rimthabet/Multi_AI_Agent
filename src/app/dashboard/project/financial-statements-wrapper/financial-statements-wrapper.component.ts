import { Component, effect } from '@angular/core';
import { FinancialDataComponent } from '../../../projects/projects-study/financial-data/financial-data.component';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FinancialStatementSheetComponent } from "../../../tools/financial-statement-sheet/financial-statement-sheet.component";
import { BarChart08Component } from "../../../widgets/bar-chart-08/bar-chart-08.component";
@Component({
  selector: 'financial-statements-wrapper',
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, FinancialStatementSheetComponent, BarChart08Component],
  templateUrl: './financial-statements-wrapper.component.html',
  styleUrl: './financial-statements-wrapper.component.scss'
})
export class FinancialStatementsWrapperComponent extends FinancialDataComponent {

  //VARIABLES
  selectedItem: any | undefined;

  //METHODS
  handleData(data: any) {
    this.selectedItem = data;
  }

  projectChanged = effect(() => {
    this.loadData();
  });

}
