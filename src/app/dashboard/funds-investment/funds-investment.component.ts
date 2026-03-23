import { Component, input, effect } from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { CurrencyPipe } from '@angular/common';
import { PieChart02Component } from "../../widgets/pie-chart-02/pie-chart-02.component";

@Component({
  selector: 'funds-investment',
  imports: [CdsModule, ClarityModule, CurrencyPipe, PieChart02Component],
  templateUrl: './funds-investment.component.html',
  styleUrl: './funds-investment.component.scss'
})
export class FundsInvestmentComponent {
  //Inputs
  liquiditeActifsFunds = input<any[]>();

  //Variables
  totalInvesti: number = 0;

  // Effects
  readonly invLiberationStatsEffect = effect(() => {
    this.calculateTotalInvesti();
  });

  //Calculations
  calculateTotalInvesti() {
    this.totalInvesti = 0;

    this.liquiditeActifsFunds()?.forEach((item: any) => {
      this.totalInvesti += item.actifInvesti;
    });

  }
}