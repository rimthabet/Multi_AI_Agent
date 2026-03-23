import { Component, DestroyRef, effect, inject, input, model } from '@angular/core';
import { ManagementService } from '../../../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CdsModule } from '@cds/angular';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { ClarityModule } from '@clr/angular';
import { PieChart04Component } from '../../../../../../widgets/pie-chart-04/pie-chart-04.component';

@Component({
  selector: 'financing-schema',
  imports: [CdsModule, ClarityModule, DecimalPipe, PercentPipe, PieChart04Component],
  templateUrl: './financing-schema.component.html',
  styleUrl: './financing-schema.component.scss'
})
export class FinancingSchemaComponent {

  /// INPUTS
  scif = input<any>();
  financement = input<any>();
  loading = model<boolean>(false);
  totalFinancing = model<number>(0);

  /// DEPENDENCIES
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);

  financements: any[] = [];
  participations: any[] = [];

  // EFFECT
  readonly financingEffect = effect(() => {
    if (this.financement()?.id) {
      this.loadParticipations();
    }
    if (this.scif()?.id) {
      this.loadFinancing();
    }
  });

  /// LOAD PARTICIPATIONS
  loadParticipations() {
    this.managementService
      .findParticipationFondsByFinancement(this.financement()?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.participations = data;

        },
        complete: () => { this.loadFinancing(); this.calculateTotal(); },
      })
  }

  /// LOAD FINANCING
  loadFinancing(): void {
    this.loading.set(true);
    this.managementService.findSchemaFinancement(this.scif()?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          if (data != null) {
            this.financements = [
              ...(this.participations?.map((p: any) => ({
                libelle: p.fonds.denomination,
                montant: p.montantCCA + p.montantOCA + p.montantActions,
                natureBailleurFonds: { libelle: 'FCPR' },
              })) ?? []),
              ...data,
            ];

            this.calculateTotal();
          }
        },
        complete: () => {
          this.loading.set(false);
        },
      })
  }

  calculateTotal(): void {
    this.totalFinancing.set(this.financements?.reduce(
      (a: number, b: any) => a + (b.montant),
      0
    ));
  }
}