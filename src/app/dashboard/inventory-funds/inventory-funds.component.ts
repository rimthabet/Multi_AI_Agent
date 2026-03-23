import { Component, input } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'inventory-funds',
  imports: [ClarityModule, CdsModule, RouterLink],
  templateUrl: './inventory-funds.component.html',
  styleUrl: './inventory-funds.component.scss'
})
export class InventoryFundsComponent {
  //INPUTS
  fonds = input<any[]>([]);

  //ETAT COLOR
  getEtatColor(fonds: any): string {
    return fonds?.etat?.couleur;
  }
}
