import { Component, DestroyRef, effect, inject, input, model, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ManagementService } from '../../../services/management.service';
import { DatePipe } from '@angular/common';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { FinInvSchemasGroupComponent } from './fin-inv-schemas-group/fin-inv-schemas-group.component';

@Component({
  selector: 'fin-inv-schemas-wrapper',
  imports: [CdsModule, ClarityModule, DatePipe, FinInvSchemasGroupComponent],
  templateUrl: './fin-inv-schemas-wrapper.component.html',
  styleUrl: './fin-inv-schemas-wrapper.component.scss'
})
export class FinInvSchemasWrapperComponent implements OnDestroy {

  /// INPUTS
  projet = input<any>();
  loading = model<boolean>(false);

  /// DEPENDENCIES
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);

  /// STATE
  financements: any[] = [];

  /// EFFECT  
  readonly projetEffect = effect(() => {
    if (this.projet()?.projet?.id) {
      this.loadFinancements(this.projet()?.projet?.id);
    }
  });

  /// LOAD FINANCING
  loadFinancements(projetId: any): void {

    this.loading.set(true);
    this.financements = [];

    this.managementService.findFinancementByProjectId(projetId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.financements = data ?? [];
        },
        complete: () => this.loading.set(false)
      });
  }

  /// ON DESTROY
  ngOnDestroy(): void {
    this.projetEffect.destroy();
  }
}
