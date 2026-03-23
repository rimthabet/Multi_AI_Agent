import { Component, DestroyRef, effect, inject, input, model } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../../../services/management.service';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { PieChart04Component } from '../../../../../../widgets/pie-chart-04/pie-chart-04.component';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'other-financing-schema',
  imports: [CdsModule, ClarityModule, DecimalPipe, PercentPipe, PieChart04Component],
  templateUrl: './others-schema.component.html',
  styleUrl: './others-schema.component.scss'
})
export class OtherFinancingSchemaComponent {

  /// INPUTS
  scif = input<any>();
  loading = model<boolean>(false);
  totalOtherFinancing = model<number>(0);

  /// DEPENDENCIES
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastService = inject(ToastrService);

  others: any[] = [];

  // EFFECT
  readonly otherFinancingEffect = effect(() => {
    if (this.scif()?.id) {
      this.loadOtherFinancing();
    }
  });

  /// LOAD OTHER FINANCING
  loadOtherFinancing(): void {
    this.loading.set(true);
    this.managementService.findSchemaExpense(this.scif()?.id)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (data: any) => {
        this.others = data;
        this.totalOtherFinancing.set(this.others?.reduce(
          (a: number, b: any) => a + b.montant,
          0
        ));
      },
      complete: () => {
        this.loading.set(false);
      },
    })
  }

}
