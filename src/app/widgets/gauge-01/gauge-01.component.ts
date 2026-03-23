import { Component, Input, input } from '@angular/core';
import { NgxGaugeModule } from 'ngx-gauge';

@Component({
  selector: 'gauge-01',
 
  imports: [NgxGaugeModule],
  templateUrl: './gauge-01.component.html',
  styleUrl: './gauge-01.component.scss'
})
export class Gauge01Component {
  title = input<string | undefined>();

  title2 = input<string>("Nbre d'actions");
  title3 = input<string>("Montant");


  value1 = input<number>();
  value2 = input<number | string>();
  value3 = input<number | string>();


  format(value?: number): number {
    return value !== undefined ? Math.round(100 * value) / 100 : 0;
  }


  getCodeFromColor(color: string): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(color)
      .trim();
  }

}
