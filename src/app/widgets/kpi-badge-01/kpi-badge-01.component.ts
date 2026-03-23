import { CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { ClarityModule } from '@clr/angular';

@Component({
  selector: 'app-kpi-badge-01',
  imports: [PercentPipe, CurrencyPipe, DecimalPipe, ClarityModule],
  templateUrl: './kpi-badge-01.component.html',
  styleUrl: './kpi-badge-01.component.scss'
})
export class KpiBadge01Component {

  value = input<any>(0);
  color = input<string>('var(--cds-alias-status-info)');
  type = input<'ratio' | 'currency' | 'number' | 'text'>('text');
  title = input<string>('');
  description = input<string | null>(null);
  reverse = input<boolean>(false);
  size = input<'small' | 'medium' | 'large'>('medium');
  primary = input<boolean>(true);


}