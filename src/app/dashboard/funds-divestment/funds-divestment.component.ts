import { Component, computed, input } from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { DatePipe, DecimalPipe } from '@angular/common';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'funds-divestment',
  standalone: true,
  imports: [CdsModule, ClarityModule, DatePipe, CurrencyPipe, DecimalPipe],
  templateUrl: './funds-divestment.component.html',
  styleUrl: './funds-divestment.component.scss'
})
export class FundsDivestmentComponent {
  //INPUTS
  funds_divestment = input<any[]>([]);

  //Computed
  funds = computed(() => {
    const groups = this.funds_divestment().reduce((acc: Record<string, any[]>, fund) => {
      if (fund.dateComiteAutorisantSortie) {
        const libelle = fund.fonds?.denomination;
        acc[libelle] = acc[libelle] || [];
        acc[libelle].push(fund);
      }
      return acc;
    }, {});

    return Object.entries(groups).map(([denomination, sorties]) => ({ denomination, sorties }));
  });

}