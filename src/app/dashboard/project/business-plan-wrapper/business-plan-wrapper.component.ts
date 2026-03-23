import { Component, input, viewChildren } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { BusinessPlanComponent } from '../../../projects/projects-creation/financial-study/business-plan/business-plan.component';
import { FinancialStatementComponent } from '../../../projects/projects-study/financial-data/financial-statement/financial-statement.component';
import { FinancialStatementSheetComponent } from "../../../tools/financial-statement-sheet/financial-statement-sheet.component";
import { DatePipe } from '@angular/common';
import { BarChart09Component } from "../../../widgets/bar-chart-09/bar-chart-09.component";

@Component({
  selector: 'business-plan-wrapper',
  imports: [ClarityModule, CdsModule, FinancialStatementSheetComponent, DatePipe, BarChart09Component],
  templateUrl: './business-plan-wrapper.component.html',
  styleUrl: './business-plan-wrapper.component.scss'
})
export class BusinessPlanWrapperComponent extends BusinessPlanComponent {
  //Inputs
  override prospection = input<any>();

  //VIEWCHILDREN
  businessPlans = viewChildren<FinancialStatementComponent>("businessPlan");

  //PROPERTIES
  selectedItem: any | undefined;

  selectedTab: number = 0;

  //METHODS
  ngOnChanges(changes: any): void {
    if (changes['prospection'] && !changes['prospection'].firstChange) {
      this.loadBPs();
    }
  }

  handleData(data: any) {
    this.selectedItem = data;
  }
}
