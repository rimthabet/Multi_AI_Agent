import { Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { Gauge02Component } from '../../../../../../widgets/gauge-02/gauge-02.component';
import { ToastrService } from 'ngx-toastr';
import { FinStatementService } from '../../../../../../services/fin-statement.service';
import { ManagementService } from '../../../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { KpiBadge01Component } from "../../../../../../widgets/kpi-badge-01/kpi-badge-01.component";

@Component({
  selector: 'tri-oca',
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, Gauge02Component, DecimalPipe, KpiBadge01Component],
  templateUrl: './tri-oca.component.html',
  styleUrls: ['../tri-capital/tri-capital.component.scss'],
})
export class TriOcaComponent implements OnInit {
  // ===== INPUTS =====
  prospection = input<any>();
  financement = input<any>();
  participation = input<any>();
  businessPlans = input<any[]>();
  fonds = input<any>();
  valorisationAction = input<any>();

  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly finStatementService = inject(FinStatementService);

  // ===== PROPERTIES =====
  selectedBP: any | undefined;
  loading: boolean = false;
  submitBtnState: boolean = false;
  _participation: any | undefined;

  saveForm: FormGroup = this.formBuilder.group({
    participation: [0, [Validators.required]],
    tauxRenumeration: [0, [Validators.required]],
    tri: [undefined, [Validators.required]],
    bp: [0, [Validators.required]],
  });

  resultatsExploitation: any[] | undefined;
  renumerationsOCA: any[] | undefined;
  cashFlow: any[] | undefined;

  valeurAction: number = 0;
  totalRemboursement: number = 0;
  triOCA: number = 0;

  lastTri: any | undefined;

  // ===== INITIALIZE =====
  ngOnInit(): void {
    this._participation = this.participation();
    this.saveForm.controls['bp'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value: any) =>
      this.loadResultatsExploitation(value)
    );
    this.valeurAction = this.valorisationAction()?.nominalApPart;

    const plans = this.businessPlans();
    if (Array.isArray(plans) && plans.length > 0) {
      this.selectedBP = plans[0];
      this.saveForm.controls['bp'].patchValue(this.selectedBP?.id);
    }

    if (this.participation()) {
      this.loadLastTri();
    }
  }

  // ===== SET PARTICIPATION =====
  setParticipation(data: any) {
    this._participation = data;
  }

  // ===== LOAD LAST TRI =====
  loadLastTri() {
    this.managementService
      .findLastCalculatedTRI(this.financement()?.id, 'oca')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          if (data != null) {
            this.saveForm.controls['tauxRenumeration'].setValue(
              data.tauxRenumeration
            );
            this.saveForm.controls['bp'].setValue(data.bp.id);
            this.triOCA = data.tri;
          }
        },
        error: (error: any) => {
        },
        complete: () => {
        }
      })
  }

  // ===== SAVE TRI =====
  saveTri() {
    let tri = {
      id: this.lastTri ? this.lastTri.id : null,
      financementRef: this.financement()?.id,
      projetRef: this.financement()?.projet.id,
      fondsRef: this.fonds()?.id,
      bp: { id: this.selectedBP },
      tauxRenumeration: this.saveForm.controls['tauxRenumeration'].value,
      tri: this.triOCA,
      totalRemboursement: this.totalRemboursement,
    };

    this.managementService.saveTri(tri, 'oca').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.lastTri = data;
        this.toastr.success('TRI OCA sauvegardé avec succès');
      },
      error: (error: any) => {
        this.toastr.error('Erreur lors de la sauvegarde du TRI OCA');
      },
      complete: () => {
      }
    })
  }

  // ===== LOAD RESULTATS EXPLOITATION =====
  loadResultatsExploitation(bp?: any) {
    if (bp != -1 && bp != undefined) {
      this.selectedBP = this.businessPlans()?.filter(
        (_bp: any) => _bp.id == bp
      )[0];
      this.loading = true;

      this.finStatementService
        .fetchResultatExplotation(this.prospection()?.id, bp)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((data: any) => {
          this.resultatsExploitation = data;
          this.evaluateKPIs();
          this.loading = false;
        })
    }
  }

  // ===== SET BPS =====
  setBPs(data: any) {
    this.businessPlans = data;
    this.selectedBP = data[0];
    this.saveForm.controls['bp'].patchValue(this.selectedBP?.id);
    this.loadLastTri();
  }

  // ===== EVALUATE KPIS =====
  evaluateKPIs() {
    if (
      this.resultatsExploitation != undefined &&
      this.resultatsExploitation.length > 0
    ) {
      this.submitBtnState = true;

      this.renumerationsOCA = [...this.resultatsExploitation].map((d: any) => {
        let r = { ...d };
        r.value =
          (d.value * this.saveForm.controls['tauxRenumeration'].value) / 100.0;
        return r;
      });
      this.cashFlow = [
        {
          annee: this.renumerationsOCA[0].year,
          value: -1 * this._participation?.montantOCA,
        },
      ];

      this.totalRemboursement = 0;
      for (let i: number = 1; i < 4; i++) {
        this.cashFlow.push({
          annee: this.renumerationsOCA[i]?.year,
          value: this.renumerationsOCA[i]?.value,
        });
        this.totalRemboursement += this.renumerationsOCA[i]?.value;
      }

      this.cashFlow.push({
        annee: this.renumerationsOCA[4]?.year,
        value: this.renumerationsOCA[4]?.value + this._participation?.montantOCA
      });
      this.totalRemboursement +=
        this.renumerationsOCA[4]?.value + this._participation?.montantOCA

      this.finStatementService.calculateTri(this.cashFlow).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
        (data: any) => {
          this.triOCA = data;
          this.submitBtnState = false;
        },
        (error) => (this.triOCA = Infinity)
      );
    }
  }

  // ===== FORMAT ===== 
  format(n: number) {
    return n?.toLocaleString('fr', { minimumFractionDigits: 2 });
  }

  // ===== FORMAT INT =====
  formatInt(n: number) {
    return n?.toLocaleString('fr', { maximumFractionDigits: 0 });
  }
}