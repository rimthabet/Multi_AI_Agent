import { Component, input, model } from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { InvestmentSchemaComponent } from "./investment-schema/investment-schema.component";
import { FinancingSchemaComponent } from "./financing-schema/financing-schema.component";
import { OtherFinancingSchemaComponent } from "./others-schema/others-schema.component";

@Component({
  selector: 'fin-inv-schema',
  imports: [ClarityModule, CdsModule, InvestmentSchemaComponent, FinancingSchemaComponent, OtherFinancingSchemaComponent],
  templateUrl: './fin-inv-schema.component.html',
  styleUrl: './fin-inv-schema.component.scss'
})
export class FinInvSchemaComponent {

  /// INPUTS
  scif = input<any>();
  financement = input<any>();

  /// Models  
  totalInvestissement = model<number>(0);
  totalFinancing = model<number>(0);
  totalOtherFinancing = model<number>(0);
  loading = model<boolean>(false);

}
