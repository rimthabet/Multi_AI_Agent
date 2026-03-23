import { Component, DestroyRef, effect, inject, model } from '@angular/core';
import { ManagementService } from '../../../../../services/management.service';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClrStackViewModule } from "@clr/angular";
import { DatePipe } from '@angular/common';
import { CurrencyPipe } from '@angular/common';
import { CdsDividerModule, CdsButtonModule, CdsIconModule } from "@cds/angular";

@Component({
  selector: 'financing-plans-acceptance',
  imports: [ClrStackViewModule, CurrencyPipe, DatePipe, CdsDividerModule, CdsButtonModule, CdsIconModule],
  templateUrl: './financing-plans-acceptance.component.html',
  styleUrl: './financing-plans-acceptance.component.scss'
})
export class FinancingPlansAcceptanceComponent {


  prospection = model<any>(undefined);
  loading = model<boolean>(false);

  readonly destroyRef = inject(DestroyRef);
  readonly managementService = inject(ManagementService);
  readonly toastr = inject(ToastrService);

  financingPlans: [any] | undefined;

  // Loading the financing plans
  readonly financingPlansEffect = effect(() => this.loadFinancialPlans());


  // Laod the financial plans
  loadFinancialPlans() {
    this.loading.set(true);
    this.managementService
      .findFinancementByProjectId(this.prospection()?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.financingPlans = data;
        },
        error: (data: any) => { console.error(data); },
        complete: () => { this.loading.set(false); },
      })
  }

  // Approve financing plan
  approveFinancingPlan(plan: any) {

    if (confirm('Voulez-vous vraiment approuver ce plan de financement ?')) {

      this.loading.set(true);
      this.managementService
        .approveFinancingPlan(plan.id, true)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('', 'Plan de financement approuvé avec succès!');
            this.loadFinancialPlans();
          },
          error: (data: any) => {
            this.toastr.error(data?.error?.error, '', { timeOut: 15000, enableHtml: true });
          },
          complete: () => { this.loading.set(false); },
        })
    }
  }

  // Refuse financing plan
  refuseFinancingPlan(plan: any) {
    if (confirm('Voulez-vous vraiment refuser ce plan de financement ?')) {
      this.loading.set(true);
      this.managementService
        .approveFinancingPlan(plan.id, false)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('', 'Plan de financement refusé avec succès!');
            this.loadFinancialPlans();
          },
          error: (data: any) => {
            this.toastr.error(data?.error?.error, '', { timeOut: 15000, enableHtml: true });
          },
          complete: () => { this.loading.set(false); },
        })
    }
  }
}
