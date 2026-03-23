import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'funds-comite-investment',
  imports: [CdsModule, ClarityModule, DatePipe, DecimalPipe, RouterLink],
  templateUrl: './funds-comite-investment.component.html',
  styleUrl: './funds-comite-investment.component.scss'
})
export class FundsComiteInvestmentComponent {
  //inputs
  comitesInvestissement = input<any[]>();


  //calculate total
  calculateMontantTotal(comite: any): number {
    return (
      comite.pfa.montantCCA + comite.pfa.montantOCA + comite.pfa.montantActions
    );
  }

  //decision text
  decisionText(decision: number): string {
    switch (decision) {
      case 0:
        return 'ACCEPTÉE';
      case 1:
        return 'REFUSÉE';
      case 2:
        return 'APPROFONDIE';
      default:
        return 'ACCEPTÉE AVEC RÉSERVE';
    }
  }
}
