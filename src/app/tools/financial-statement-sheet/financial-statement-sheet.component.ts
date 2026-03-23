import { Component, input, output } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FinancialStatementComponent } from '../../projects/projects-study/financial-data/financial-statement/financial-statement.component';
import { DataFormComponent } from "../../projects/projects-study/financial-data/financial-statement/data-form/data-form.component";

@Component({
  selector: 'financial-statement-sheet',
  imports: [ClarityModule, CdsModule, DataFormComponent],
  templateUrl: './financial-statement-sheet.component.html',
  styleUrl: './financial-statement-sheet.component.scss'
})
export class FinancialStatementSheetComponent extends FinancialStatementComponent {

  //INPUTS
  override ref2 = input<number>(-1);
  override ref3 = input<number>(-1);
  override ref4 = input<number>(-1);
  override ref5 = input<number>(-1);
  override prospection = input<any>();
  override data = input<any>();
  override item = input<any>();
  override year = input<number>(new Date().getFullYear());
  override years = input<any>();
  override columns = input<number>(5);

  //OUTPUTS
  itemSelected = output<any>();

  //VARIABLES
  selectedItem: any;

  //ON CLICK
  onRowClick(item: any) {
    this.itemSelected.emit(item);
  }

}
