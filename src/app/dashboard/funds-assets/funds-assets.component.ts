import { Component, computed, input } from '@angular/core';
import { CdsDividerModule } from '@cds/angular';
import { CurrencyPipe } from '@angular/common';
import { PieChart03Component } from "../../widgets/pie-chart-03/pie-chart-03.component";

@Component({
  selector: 'funds-assets',
  imports: [CdsDividerModule, CurrencyPipe, PieChart03Component],
  templateUrl: './funds-assets.component.html',
  styleUrl: './funds-assets.component.scss'
})
export class FundsAssetsComponent {

  subscriptions = input<any>();
  chartData = computed(() => {

    const fundsAssetsIndex: Map<string, number> = new Map();
    this.subscriptions()?.souscriptions?.forEach((subscription: any) => {

      if (fundsAssetsIndex.has(subscription?.fonds?.denomination)) {
        fundsAssetsIndex.set(subscription.fonds.denomination, fundsAssetsIndex.get(subscription.fonds.denomination) + subscription.montantSouscription);
      } else {
        fundsAssetsIndex.set(subscription.fonds.denomination, subscription.montantSouscription);
      }

    });

    return Array.from(fundsAssetsIndex.entries()).map(([denomination, amount]) => {
      return {
        y: amount,
        name: denomination
      };
    });

  });

  totalAssets = computed(() => {
    return this.subscriptions()?.souscriptions?.reduce((total: number, subscription: any) => total + subscription.montantSouscription, 0);
  });

}
