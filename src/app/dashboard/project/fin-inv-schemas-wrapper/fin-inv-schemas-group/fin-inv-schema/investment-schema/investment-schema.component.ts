import { DecimalPipe, PercentPipe } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, model, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ManagementService } from '../../../../../../services/management.service';
import { PieChart04Component } from "../../../../../../widgets/pie-chart-04/pie-chart-04.component";
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'investment-schema',
  imports: [CdsModule, ClarityModule, DecimalPipe, PercentPipe, PieChart04Component],
  templateUrl: './investment-schema.component.html',
  styleUrl: './investment-schema.component.scss'
})
export class InvestmentSchemaComponent {

  /// INPUTS
  scif = input<any>();
  loading = model<boolean>(false);
  totalInvestissement = model<number>(0);

  /// DEPENDENCIES
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastService = inject(ToastrService);

  investissements: any[] = [];

  // EFFECT
  readonly investissementEffect = effect(() => {
    if (this.scif()?.id) {
      this.loadInvestissement();
    }
  });

  /// LOAD INVESTISSEMENTS
  loadInvestissement(): void {

    this.loading.set(true);
    this.managementService.findSchemaInvestissement(this.scif()?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.investissements = data;
          this.totalInvestissement.set(this.investissements?.reduce(
            (a: number, b: any) => a + b.montant,
            0
          ));
        },
        complete: () => {
          this.loading.set(false);
        },
        error: (err) => {
          this.toastService.error(err?.message || 'Erreur de téléchargement des investissements');
        },
      });
  }
}
