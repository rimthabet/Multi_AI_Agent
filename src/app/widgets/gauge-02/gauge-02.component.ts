import { Component, input } from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { NgxGaugeModule } from 'ngx-gauge';

@Component({
  selector: 'gauge-02',
 
  imports: [ClarityModule, CdsModule, NgxGaugeModule],
  templateUrl: './gauge-02.component.html',
  styleUrls: ['./gauge-02.component.scss']
})
export class Gauge02Component {
  title = input<string | undefined>();
  title2 = input<string>('Montant');
  title3 = input<string>("Nbre d'actions");
  title4 = input<string>("Montant OCA");

  value1 = input<number>(0);
  value2 = input<number | string>(0);
  value3 = input<number |string>(0);
  value4 = input<number | string>(0);

  format(value: number) {
    return Math.round(100 * value) / 100;
  }

  getCodeFromColor(color: string): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(color)
      .trim();
  }
}
