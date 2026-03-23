import { Component, input } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';

@Component({
  selector: 'comite-investment-document-generation',
  imports: [ClarityModule, CdsModule],
  templateUrl: './comite-investment-document-generation.component.html',
  styleUrl: './comite-investment-document-generation.component.scss'
})
export class ComiteInvestmentDocumentGenerationComponent {
 //Inputs
 prospection = input<any>();
}
