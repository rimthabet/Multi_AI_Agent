import { Component, effect, input } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { DecimalPipe } from '@angular/common';
import { KpiBadge01Component } from "../../../../widgets/kpi-badge-01/kpi-badge-01.component";

@Component({
  selector: 'invested-project',
  imports: [ClarityModule, CdsModule, KpiBadge01Component, DecimalPipe],
  templateUrl: './invested-project.component.html',
  styleUrl: './invested-project.component.scss'
})
export class InvestedProjectComponent {

  // inputs
  souscriptions = input<any[]>();
  readonly souscriptionsEffect = effect(() => {

    if (this.souscriptions()) {
      this.refresh()
    }
  });

  // properties

  data: any | undefined;
  totalActions: number = 0;
  totalOCA: number = 0;
  totalCCA: number = 0;

  NbrActions: number = 0;
  NbrOCA: number = 0;
  NbrCCA: number = 0;
  nombreFonds: number = 0;

  souscriptionMax: any | undefined;
  souscriptionMin: any | undefined;

  // SET DATA
  private refresh() {

    this.data = this.souscriptions();

    if (!this.data || this.data.length == 0) {
      this.souscriptionMin = 0;
      this.souscriptionMax = 0;
      return;
    }

    let maxMontant = 0;
    let minMontant = 0;
    let souscriptionMax: any;
    let souscriptionMin: any;

    let uniqueFonds = new Set<number>();

    this.totalActions = 0;
    this.totalOCA = 0;
    this.totalCCA = 0;

    this.NbrActions = 0;
    this.NbrOCA = 0;
    this.NbrCCA = 0;

    this.data.forEach((item: any) => {
      if (item.p && item.p.length > 0) {

        uniqueFonds.add(item.p[0].fonds.id);
        item.p.forEach((subItem: any) => {

          if (subItem.montant) {

            switch (subItem.type) {
              case 'Actions':
                this.totalActions += subItem.montant;
                this.NbrActions++;
                break;
              case 'OCA':
                this.totalOCA += subItem.montant;
                this.NbrOCA++;
                break;
              case 'CCA':
                this.totalCCA += subItem.montant;
                this.NbrCCA++;
                break;
              default:
                break;
            }

            if (subItem.montant > maxMontant) {
              maxMontant = subItem.montant;
              souscriptionMax = subItem;
            }

            if (minMontant == 0 || subItem.montant < minMontant) {
              minMontant = subItem.montant;
              souscriptionMin = subItem;
            }
          }
        });
      }
    });

    this.nombreFonds = uniqueFonds.size;

    this.souscriptionMax = souscriptionMax;
    this.souscriptionMin = souscriptionMin;

  }
}
