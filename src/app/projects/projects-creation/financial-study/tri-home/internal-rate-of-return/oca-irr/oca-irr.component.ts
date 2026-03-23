import { Component, DestroyRef, inject, input } from '@angular/core';
import { ClrNumberInputModule, ClrSelectModule } from "@clr/angular";
import { CdsIconModule, CdsButtonModule } from "@cds/angular";
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { FinStatementService } from '../../../../../../services/fin-statement.service';
import { ManagementService } from '../../../../../../services/management.service';
import { DecimalPipe } from '@angular/common';
import { Gauge02Component } from '../../../../../../widgets/gauge-02/gauge-02.component';
import { KpiBadge01Component } from '../../../../../../widgets/kpi-badge-01/kpi-badge-01.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'oca-irr',
  imports: [ClrSelectModule, ClrNumberInputModule, ReactiveFormsModule, Gauge02Component, CdsIconModule, CdsButtonModule, DecimalPipe, KpiBadge01Component],
  templateUrl: './oca-irr.component.html',
  styleUrl: './oca-irr.component.scss'
})
export class OcaIrrComponent {


  // ===== INPUTS =====
  prospection = input<any>();
  financement = input<any>();
  participation = input<any>();
  businessPlans = input<any[]>();
  fonds = input<any>();
  valorisationAction = input<any>();

  // ===== DEPENDENCIES =====

  private readonly fb = inject(FormBuilder);
  private readonly managementService = inject(ManagementService);
  private readonly finStatementService = inject(FinStatementService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastr = inject(ToastrService);

  paramsForm = this.fb.group({
    tauxRenumeration: [0, [Validators.required]],
    businessPlan: [null as any, [Validators.required]],
  });

  irrCalculationData: any[] = [];
  renumerationsOCA: any[] = [];
  cashFlow: any[] = [];

  netDeptEntity: any | undefined;
  netDeptDatum: any | undefined;

  loading: boolean = false;
  isPreviousData: boolean = false;

  lastYearCashFlow: number | undefined;
  totalRemboursement: number | undefined;

  irr: number | undefined;
  previousIRR: any | undefined;


  //////// Ignition Methods

  ngOnInit(): void {

    // Load the previous persisted IRR
    this.loadPreviousIRR();

    // Load the Net Dept entity specs
    this.loadNetDeptEntitySpecs();

  }

  // Load the Net Dept entity specifications
  loadNetDeptEntitySpecs(): void {
    this.finStatementService.fetchEntities('DE.1')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.netDeptEntity = data && Array.isArray(data) && data.length > 0 ? data[0] : undefined;
        },
        error: () => { }
      });
  }


  public calculateIRR() {

    // Once we choose the calculation basis and the right business plan
    // we need to fetch the corresponding IRR calculation data

    const tauxRenumerationOCA = this.paramsForm.get('tauxRenumeration')?.value;
    const businessPlan = this.paramsForm.get('businessPlan')?.value;

    if (tauxRenumerationOCA && businessPlan && this.netDeptEntity) {

      const businessPlanId = businessPlan.id;

      this.loading = true;

      this.finStatementService
        .fetchResultatExplotation(this.prospection()?.id, businessPlanId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((data: any) => {

          this.irrCalculationData = data;
          const lastYearIrrData = this.irrCalculationData[this.irrCalculationData.length - 1];

          // second we need to load the depts for the selected BP and basis
          this.finStatementService.fetchDatum2(
            this.prospection().id,
            this.paramsForm.get("businessPlan")?.value?.id,
            this.netDeptEntity,
            lastYearIrrData.year, -1, -1, false
          ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (data: any) => {

              this.netDeptDatum = data;

              this.renumerationsOCA = [...this.irrCalculationData].map((d: any) => {
                let r = { ...d };

                if (d.year === lastYearIrrData.year) {
                  r.value =
                    ((d.value - this.netDeptDatum.value) * (this.paramsForm.controls['tauxRenumeration'].value || 0)) / 100.0;
                } else {
                  r.value =
                    (d.value * (this.paramsForm.controls['tauxRenumeration'].value || 0)) / 100.0;
                }
                return r;
              });
              this.cashFlow = [
                {
                  annee: this.renumerationsOCA[0].year,
                  value: -1 * this.participation()?.montantOCA,
                },
              ];

              this.totalRemboursement = 0;
              for (let i: number = 1; i < this.renumerationsOCA.length - 1; i++) {
                this.cashFlow.push({
                  annee: this.renumerationsOCA[i]?.year,
                  value: this.renumerationsOCA[i]?.value,
                });
                this.totalRemboursement += this.renumerationsOCA[i]?.value;
              }

              this.cashFlow.push({
                annee: this.renumerationsOCA[this.renumerationsOCA.length - 1]?.year,
                value: this.renumerationsOCA[this.renumerationsOCA.length - 1]?.value + this.participation()?.montantActions
              });
              this.totalRemboursement +=
                this.renumerationsOCA[4]?.value + this.participation()?.montantActions


              // Call the IRR calculation service with the prepared parameters
              this.finStatementService.calculateTri(this.cashFlow)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                  next: (tri: any) => {
                    this.irr = tri;
                    this.isPreviousData = false;
                  },
                  error: () => { },
                  complete: () => this.loading = false
                });

            }
          });

        }
        );
    }
  }



  // Load previous IRR if available
  private loadPreviousIRR(): void {

    const financementId = this.financement()?.id;
    if (!financementId) return;

    this.managementService.findLastCalculatedTRI(financementId, 'oca')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.irr = data.tri
          this.totalRemboursement = data.tauxRenumeration;
          this.isPreviousData = true;
        },
        error: () => { },
        complete: () => this.loading = false
      });
  }

  // Persists the calculated IRR value for later usage
  persistIRR(): void {

    let tri = {
      id: this.previousIRR?.id || -1,
      financementRef: this.financement()?.id,
      projetRef: this.financement()?.projet.id,
      fondsRef: this.fonds()?.id,
      bp: this.paramsForm.get("businessPlan")?.value,
      tauxRenumeration: this.paramsForm.controls['tauxRenumeration'].value,
      tri: this.irr,
      totalRemboursement: this.totalRemboursement,
    };

    this.managementService.saveTri(tri, 'oca').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.previousIRR = data;
        this.toastr.success('TRI OCA sauvegardé avec succès');
      },
      error: (error: any) => {
        this.toastr.error('Erreur lors de la sauvegarde du TRI OCA');
      },
      complete: () => {
      }
    })

  }


  //////// Transformation Methods

  format(n: number): string {
    return n?.toLocaleString('fr', { minimumFractionDigits: 0 });
  }

  formatInt(n: number): string {
    return n?.toLocaleString('fr', { maximumFractionDigits: 0 });
  }

  equals(a: any, b: any): boolean {
    return a?.id === b?.id;
  }
}
