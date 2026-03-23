import { Component, input } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { DecimalPipe } from '@angular/common';
import { KpiBadge01Component } from "../../../widgets/kpi-badge-01/kpi-badge-01.component";

@Component({
  selector: 'fund-subscriber-subscriptions-grid',
  imports: [ClarityModule, CdsModule, DecimalPipe, KpiBadge01Component],
  templateUrl: './fund-subscriber-subscriptions-grid.component.html',
  styleUrl: './fund-subscriber-subscriptions-grid.component.scss'
})
export class FundSubscriberSubscriptionsGridComponent {
  // Input
  subscribers = input<any[] | undefined>();
  souscriptions = input<any>();
  totalMontantSouscription = input<number>(0);

  // Ratio  
  getRatio(n: number, m: number): number {
    return Math.round((n / m) * 100);
  }
}
