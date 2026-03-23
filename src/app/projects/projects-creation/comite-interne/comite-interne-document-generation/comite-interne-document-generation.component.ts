import { Component, input } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';

@Component({
  selector: 'comite-interne-document-generation',
  imports: [ClarityModule, CdsModule],
  templateUrl: './comite-interne-document-generation.component.html',
  styleUrl: './comite-interne-document-generation.component.scss'
})
export class ComiteInterneDocumentGenerationComponent {
  prospection = input<any>();
}
