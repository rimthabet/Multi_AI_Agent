import { Component, input } from '@angular/core';
import { CdsButtonModule, CdsIconModule, CdsDividerModule } from '@cds/angular';
import { BarChart02Component } from '../../../widgets/bar-chart-02/bar-chart-02.component';
@Component({
  selector: 'subscribed-released-fund',
  imports: [
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    BarChart02Component
  ],
  templateUrl: './subscribed-released-fund.component.html',
  styleUrl: './subscribed-released-fund.component.scss'
})
export class SubscribedReleasedFundComponent {

  //Inputs
  souscriptions = input<any>([]);

  loadingSouscription: boolean = false;

  //chart data
  chartData(data: any): any {
    if (!data) return { periodes: [], souscriptions: [] };

    const periodes = data.periodes;
    const souscriptionsRaw = data.souscriptions;

    const souscriptions = souscriptionsRaw.map((item: any) => ({
      souscription: {
        dateSouscription: item.souscription.dateSouscription,
        montantSouscription: item.souscription.montantSouscription,
      },
      liberations: (item.liberations).map((lib: any) => ({
        montantLiberation: lib.montantLiberation,
      })),
    }));
    return {
      periodes,
      souscriptions,
    };
  }


}
