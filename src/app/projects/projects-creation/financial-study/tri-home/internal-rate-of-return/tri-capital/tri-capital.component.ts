import { Component, DestroyRef, effect, inject, input, OnInit } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../../../services/management.service';
import { FinStatementService } from '../../../../../../services/fin-statement.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Gauge02Component } from '../../../../../../widgets/gauge-02/gauge-02.component';
import { DecimalPipe } from '@angular/common';
import { KpiBadge01Component } from "../../../../../../widgets/kpi-badge-01/kpi-badge-01.component";

@Component({
  selector: 'tri-capital',
  standalone: true,
  imports: [ClarityModule, CdsModule, ReactiveFormsModule, Gauge02Component, DecimalPipe, KpiBadge01Component],
  templateUrl: './tri-capital.component.html',
  styleUrl: './tri-capital.component.scss',
})
export class TriCapitalComponent implements OnInit {

  // Inputs
  prospection = input<any>();
  financement = input<any>();
  participation = input<any>();
  businessPlans = input<any[]>();

  fonds = input<any>();
  valorisationAction = input<any>();

  // Services
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly finStatementService = inject(FinStatementService);

  // Form
  saveForm = this.createForm();

  // Data
  selectedBP: any;
  triData: any[] = [];
  parametresTri: any[] = [];
  lastTri: any;

  // Calculated values
  triCapital = 0;
  valeurSortie = 0;
  fluxTresorerie = 0;
  valeurAction = 0;

  loading = false;

  // ===== INITIALIZE =====
  ngOnInit(): void {
    this.initializeData();
    this.setupFormSubscriptions();
  }

  // ===== CREATE FORM =====
  createForm(): FormGroup {
    return this.formBuilder.group({
      participation: [0, Validators.required],
      resultat: [0, Validators.required],
      bp: [0, Validators.required],
      bpRealisation: [0, Validators.required],
      tri: [undefined, Validators.required],
      parametreTri: [undefined, Validators.required]
    });
  }

  // ===== INITIALIZE DATA =====
  initializeData(): void {
    this.valeurAction = this.valorisationAction()?.nominalApPart || 0;
    this.loadParametresTri();
    this.setDefaultBusinessPlan();

    if (this.participation()) {
      this.loadLastTri();
    }
  }


  // ===== LOAD PARAMETRES TRI =====
  loadParametresTri(): void {
    this.managementService.findParametresTRI()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.handleParametresData(data),
        error: () => { }
      });
  }

  // ===== SET DEFAULT BUSINESS PLAN =====
  setDefaultBusinessPlan(): void {
    const plans = this.businessPlans();
    if (plans?.length) {
      this.selectedBP = plans[0];
      this.saveForm.patchValue({ bp: this.selectedBP }, { emitEvent: false });
    }
  }

  // ===== SETUP FORM SUBSCRIPTIONS =====
  setupFormSubscriptions(): void {
    this.saveForm.get('bp')?.valueChanges.subscribe(bp => {
      if (bp?.id) {
        this.selectedBP = bp;
        this.loadData();
      }
    });

    // Parameter change
    this.saveForm.get('parametreTri')?.valueChanges.subscribe(param => {
      if (param && this.selectedBP) {
        this.loadTriData(param);
      }
    });
  }

  // Effect for business plans changes
  readonly bpsEffect = effect(() => {
    this.setDefaultBusinessPlan();
    if (this.participation()) {
      this.loadLastTri();
    }
    this.loadData();
  });

  loadData(): void {
    const param = this.saveForm.get('parametreTri')?.value;
    if (param && this.selectedBP) {
      this.loadTriData(param);
    }
  }

  // ===== LOAD LAST TRI =====
  loadLastTri(): void {
    const financementId = this.financement()?.id;
    if (!financementId) return;

    this.managementService.findLastCalculatedTRI(financementId, 'capital')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.handleLastTriData(data),
        error: () => { },
        complete: () => this.loading = false
      });
  }

  // ===== HANDLE LAST TRI DATA =====
  handleLastTriData(data: any): void {
    if (!data) return;

    this.lastTri = data;
    this.triCapital = data.tri;
    this.valeurSortie = data.valeurSortie;

    this.saveForm.patchValue({
      parametreTri: data.parametreTri,
      resultat: data.multipleResultat,
      bpRealisation: data.realisationBp
    });

    const plans = this.businessPlans();
    const correspondingBP = plans?.find(bp => bp.id === data.bp.id);
    if (correspondingBP) {
      this.selectedBP = correspondingBP;
      this.saveForm.patchValue({ bp: correspondingBP }, { emitEvent: false });
    }

    this.loadData();
  }

  // ===== HANDLE PARAMETRES DATA =====
  handleParametresData(data: any): void {
    this.parametresTri = JSON.parse(data.items);
    this.saveForm.patchValue({ parametreTri: this.parametresTri.find(p => p.defautTriCapital) });
    if (this.selectedBP) {
      this.loadTriData(this.saveForm.get('parametreTri')?.value);
    }
  }

  // ===== LOAD TRI DATA =====
  loadTriData(param: any): void {
    this.loading = true;
    this.finStatementService.fetchTriData(this.selectedBP?.id, this.prospection()?.id, param?.code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.triData = data;
          this.calculateKPIs();
        },
        error: (error: any) => console.error("Erreur TRI:", error),
        complete: () => this.loading = false
      });
  }

  // ===== CALCULATE KPIS =====
  calculateKPIs(): void {

    if (!this.triData?.length) return;
    const lastTriValue = this.triData[this.triData.length - 1].value;
    this.valeurSortie = this.saveForm.get('resultat')?.value * lastTriValue;

    const participation = this.participation();
    this.fluxTresorerie = (this.valeurSortie * participation?.part * this.saveForm.get('bpRealisation')?.value) / 100;
    const triParams = [
      {
        annee: this.triData[0].year,
        value: -1 * participation?.montantActions
      },
      {
        annee: this.triData[this.triData.length - 1].year,
        value: this.fluxTresorerie
      }
    ];
    this.calculateTri(triParams);
  }

  // ===== CALCULATE TRI =====
  calculateTri(params: any[]): void {

    this.finStatementService.calculateTri(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tri: any) => {
          this.triCapital = tri;
        },
        error: () => { }
      });
  }


  // ===== SAVE TRI =====
  saveTri(): void {
    const triData = {
      id: this.lastTri?.id || -1,
      financementRef: this.financement()?.id,
      projetRef: this.financement()?.projet.id,
      fondsRef: this.fonds()?.id,
      bp: { id: this.selectedBP.id },
      multipleResultat: this.saveForm.get('resultat')?.value,
      realisationBp: this.saveForm.get('bpRealisation')?.value,
      tri: this.triCapital,
      valeurSortie: this.valeurSortie
    };

    this.managementService.saveTri(triData, 'capital')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.lastTri = data;
          this.toastr.success('TRI Capital sauvegardé avec succès');
        },
        error: () => this.toastr.error('Erreur lors de la sauvegarde du TRI Capital')
      });
  }

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