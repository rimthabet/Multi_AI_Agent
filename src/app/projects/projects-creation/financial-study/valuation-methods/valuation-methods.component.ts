import { Component, input } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { NominalValueComponent } from "./nominal-value/nominal-value.component";
import { LastTransactionComponent } from "./last-transaction/last-transaction.component";
import { MathValueComponent } from "./math-value/math-value.component";
import { CmpComponent } from "./cmp/cmp.component";
import { DcfComponent } from "./dcf/dcf.component";

@Component({
  selector: 'valuation-methods',
  imports: [ClarityModule, CdsModule, NominalValueComponent, LastTransactionComponent, MathValueComponent, CmpComponent, DcfComponent],
  templateUrl: './valuation-methods.component.html',
  styleUrl: './valuation-methods.component.scss'
})
export class ValuationMethodsComponent {
  prospection = input<any>();
}
