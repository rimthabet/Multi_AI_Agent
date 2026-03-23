import { Component, effect, input, OnInit } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { KpiBadge01Component } from "../../../../widgets/kpi-badge-01/kpi-badge-01.component";

@Component({
  selector: 'project-financing',
  imports: [ClarityModule, CdsModule, KpiBadge01Component],
  templateUrl: './project-financing.component.html',
  styleUrl: './project-financing.component.scss'
})
export class ProjectFinancingComponent implements OnInit {
  // Input signal
  financements = input<any[]>();

  projet: any | undefined;

  totalMontant = 0;
  totalAction = 0;
  totalOCA = 0;
  totalCCA = 0;

  nbrAction = 0;
  nbrOCA = 0;
  nbrCCA = 0;
  nbrTotalFonds = 0;

  // INISIALIZE
  ngOnInit(): void {
    const data = this.financements();
    if (data) {
      this.setFinancements(data);
    }
  }

  // Signal effect to reactively recalculate totals
  readonly financementsEffect = effect(() => {
    const data = this.financements();
    if (data) {
      this.setFinancements(data);
    }
  });

  // SET FINANCEMENTS
  setFinancements(data: any[]): void {
    // Reset counters
    this.nbrAction = 0;
    this.nbrOCA = 0;
    this.nbrCCA = 0;

    this.totalMontant = data.reduce(
      (total, f) => total + (f.montant || 0),
      0
    );

    this.totalAction = data.reduce(
      (total, f) => total + (f.financementActions || 0),
      0
    );

    this.totalOCA = data.reduce(
      (total, f) => total + (f.financementOCA || 0),
      0
    );

    this.totalCCA = data.reduce(
      (total, f) => total + (f.financementCCA || 0),
      0
    );

    this.nbrTotalFonds = data.reduce(
      (total, f) => total + (f.fonds?.length || 0),
      0
    );

    data.forEach(f => {
      this.projet = f.projet;
      if (f.financementActions > 0) this.nbrAction++;
      if (f.financementOCA > 0) this.nbrOCA++;
      if (f.financementCCA > 0) this.nbrCCA++;
    });
  }
}
