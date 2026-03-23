import { Component, DestroyRef, inject, input } from '@angular/core';
import { ClrSelectModule, ClrNumberInputModule } from "@clr/angular";
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Gauge02Component } from "../../../../../../widgets/gauge-02/gauge-02.component";
import { CdsIconModule, CdsButtonModule } from "@cds/angular";
import { ManagementService } from '../../../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FinStatementService } from '../../../../../../services/fin-statement.service';
import { DecimalPipe } from '@angular/common';
import { KpiBadge01Component } from "../../../../../../widgets/kpi-badge-01/kpi-badge-01.component";
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'capital-irr',
  imports: [ClrSelectModule, ClrNumberInputModule, ReactiveFormsModule, Gauge02Component, CdsIconModule, CdsButtonModule, DecimalPipe, KpiBadge01Component],
  templateUrl: './capital-irr.component.html',
  styleUrl: './capital-irr.component.scss'
})
export class CapitalIrrComponent {

  private readonly fb = inject(FormBuilder);
  private readonly managementService = inject(ManagementService);
  private readonly finStatementService = inject(FinStatementService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastr = inject(ToastrService);

  /////// Local Properties

  // Inputs
  prospection = input<any>();
  financement = input<any>();
  participation = input<any>();
  businessPlans = input<any[]>();

  fonds = input<any>();
  valorisationAction = input<any>();

  paramsForm = this.fb.group({
    basis: [null as any, Validators.required],
    multiplier: [6, Validators.required],
    realization: [100, Validators.required],
    businessPlan: [null as any, Validators.required]
  });

  irrCalculationBasis: any[] = [];
  irrCalculationData: any[] = [];

  netDeptEntity: any | undefined;
  netDeptDatum: any | undefined;

  loading: boolean = false;
  isPreviousData: boolean = false;

  lastYearCashFlow: number | undefined;
  exitValue: number | undefined;
  irr: number | undefined;
  previousIRR: any | undefined;

  //////// Ignition Methods

  ngOnInit(): void {

    // loading the calculation basis
    this.loadIrrCalculationBasis();

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


  // Load TRI calculation parameters from backend
  private loadIrrCalculationBasis(): void {
    this.managementService.findParametresTRI()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {

          this.irrCalculationBasis = JSON.parse(data.items);
          this.paramsForm.patchValue({ basis: this.irrCalculationBasis.find((p: any) => p.defautTriCapital) });

        }, error: () => { }
      });
  }



  // Loading IRR calculation data from back end 
  public calculateIRR() {

    // Once we choose the calculation basis and the right business plan
    // we need to fetch the corresponding IRR calculation data

    const basis = this.paramsForm.get('basis')?.value;
    const businessPlan = this.paramsForm.get('businessPlan')?.value;

    if (basis && businessPlan && this.netDeptEntity) {

      const basisCode = basis.code;
      const businessPlanId = businessPlan.id;

      this.loading = true;

      // First thing to do is the fetch the data series for the selected business plan and basis
      this.finStatementService.fetchTriData(businessPlanId, this.prospection()?.id, basisCode)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {

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

                const multiplier = this.paramsForm.get('multiplier')?.value || 0;
                this.exitValue = multiplier * lastYearIrrData.value;

                // We should subtract the depts then multiply by the fund participation ratio
                // We should fetch the net depts here

                this.lastYearCashFlow = (this.exitValue - this.netDeptDatum.value) * (this.participation()?.part || 0) * (this.paramsForm.get('realization')?.value || 0) / 100;

                // Prepare the IRR parameters
                const triParams = [
                  {
                    annee: this.irrCalculationData[0].year,
                    value: -1 * this.participation()?.montantActions
                  },
                  {
                    annee: this.irrCalculationData[this.irrCalculationData.length - 1].year,
                    value: this.lastYearCashFlow
                  }
                ];

                // Call the IRR calculation service with the prepared parameters
                this.finStatementService.calculateTri(triParams)
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

          },
          error: (error: any) => console.error("Erreur TRI:", error),
          complete: () => this.loading = false
        });
    }

  }


  // Load previous IRR if available
  private loadPreviousIRR(): void {

    const financementId = this.financement()?.id;
    if (!financementId) return;

    this.managementService.findLastCalculatedTRI(financementId, 'capital')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.irr = data?.tri
          this.exitValue = data?.valeurSortie

          this.isPreviousData = true;
        },
        error: () => { },
        complete: () => this.loading = false
      });
  }


  // Persists the calculated IRR value for later usage
  persistIRR(): void {

    const triData = {
      id: this.previousIRR?.id || -1,
      financementRef: this.financement()?.id,
      projetRef: this.financement()?.projet.id,
      fondsRef: this.fonds()?.id,
      bp: this.paramsForm.get("businessPlan")?.value,
      multipleResultat: this.paramsForm.get('multiplier')?.value,
      realisationBp: this.paramsForm.get('realization')?.value,
      tri: this.irr,
      valeurSortie: this.exitValue
    };

    this.managementService.saveTri(triData, 'capital')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.previousIRR = data;
          this.toastr.success('TRI Capital sauvegardé avec succès');
        },
        error: () => this.toastr.error('Erreur lors de la sauvegarde du TRI Capital')
      });
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
