import { Component, input } from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'funds-comite-strategic',
  imports: [CdsModule, ClarityModule, DatePipe],
  templateUrl: './funds-comite-strategic.component.html',
  styleUrl: './funds-comite-strategic.component.scss'
})
export class FundsComiteStrategicComponent {
  comitesStrategie = input<any[]>();
}
