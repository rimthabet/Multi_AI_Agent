import { Component, DestroyRef, inject, input, output, model, OnInit, viewChild } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DocumentUploadComponent } from "../../../tools/document-upload/document-upload.component";
import { EvaluationMethodComponent } from "../../../settings/evaluation-method/evaluation-method.component";
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';
import { CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EvaluationMethodFormComponent } from '../../../settings/evaluation-method/evaluation-method-form/evaluation-method-form.component';

@Component({
  selector: 'comite-create-form-and-grid',
  imports: [ClarityModule, CdsModule, ReactiveFormsModule, FormsModule, DecimalPipe, PercentPipe, CurrencyPipe, DocumentUploadComponent, RouterLink, EvaluationMethodFormComponent],
  templateUrl: './comite-create-form-and-grid.component.html',
  styleUrl: './comite-create-form-and-grid.component.scss'
})
export class ComiteCreateFormAndGridComponent implements OnInit {

  // ===== INPUTS =====
  fonds = input<any>();
  year = input<number>();
  projets = input<any[]>();
  methodesEvaluation = input<any[]>();

  // ===== OUTPUTS =====
  refreshEvent = output<any>();

  //// VIEWCHILD
  docUpload = viewChild.required<DocumentUploadComponent>("DocumentUploadComponent");


  // Dependencies
  private destroyRef = inject(DestroyRef);
  private managementService = inject(ManagementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);

  openedDocumentModal = model<boolean>(false);
  openedMethodeEvaluationForm = model<boolean>(false);

  loading: boolean = false;
  opened: boolean = false;
  collapsed: boolean = false;

  fins: any[] | undefined;
  conformite_documentaires: any[] = [];
  comites: any[] | undefined;

  selectedProject: any | undefined;
  totalTitres: number = 0;
  totalPMValues: number = 0;
  totalCout: number = 0;

  valuationSaveForm: FormGroup = this.formBuilder.group({
    id: [-1],
    annee: [undefined],
    fonds: [undefined],
    projet: [undefined, [Validators.required]],
    titres: [undefined],
    fondsTitres: [undefined],
    capital: [undefined],
    fondsCapital: [undefined],

    valeur: [undefined, [Validators.required]],
    valeurAction: [undefined, [Validators.required]],
    cout: [undefined],
    methodeEvaluation: [undefined, [Validators.required]],
    pmValues: [undefined, [Validators.required]],
  });


  /// ===== INITIALIZE =====
  ngOnInit(): void {
    this.loadConformitesDocumentaires();

    // In the level of modal when requesting adding new comite triggers project selection
    this.valuationSaveForm.controls['projet'].valueChanges.subscribe(
      (value: any) => {
        this.selectedProject = value;
        this.loadValorisationProjet(value?.id);
        this.loadPlanFinancements(value?.id);
      }
    )

    // In the level of modal when requesting adding new comite triggers project selection
    this.valuationSaveForm.controls['valeur'].valueChanges.subscribe(
      (value: any) => {
        this.valuationSaveForm.patchValue({
          pmValues: value - this.valuationSaveForm.value['cout'],
          valeurAction:
            value / this.valuationSaveForm.value['fondsTitres'],
        });

      }
    )

  }


  /// LOAD CONFORMITES DOCUMENTAIRES
  loadConformitesDocumentaires() {
    this.managementService
      .findConformitesByTache(6, 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: any) => {
        this.conformite_documentaires = data;
      })
  }

  /// LOAD COMITES VALORISATION
  loadComitesValorisation() {
    this.loading = true;
    this.totalTitres = 0;
    this.totalPMValues = 0;
    this.totalCout = 0;

    this.managementService
      .findComitesValorisation(this.fonds()?.id, this.year())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {

          this.comites = data;
          this.comites?.forEach((d: any) => {
            this.totalCout += d.cout;
            this.totalTitres += d.titres;
            this.totalPMValues += d.pmValues;
          });
          this.comites?.sort((a, b) => {
            if (a.projet.nom > b.projet.nom) return 1;
            if (a.projet.nom < b.projet.nom) return -1;
            return 0;
          });
        },
        complete: () => (this.loading = false),
      })
  }

  /// LOAD VALORISATION PROJET
  loadValorisationProjet(projectId: any) {
    this.loading = true;
    this.managementService
      .findValorisationProjet(
        this.fonds()?.id,
        this.selectedProject?.id,
        this.year()
      )
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.valuationSaveForm.patchValue({
            annee: this.year(),
            fonds: { id: this.fonds()?.id },
            titres: data?.pShares,
            fondsTitres: data?.fShares,
            capital: data?.pCap,
            fondsCapital: data?.fCap,
            cout: data?.cost,
          });
        },
        complete: () => (this.loading = false),
      })
  }

  /// LOAD PLAN FINANCEMENTS
  loadPlanFinancements(projectId: any) {
    this.loading = true;
    this.fins = undefined;
    this.managementService
      .findFinancementByProjetAndFondsAndAnnee(
        this.selectedProject?.id,
        this.fonds()?.id,
        this.year()
      )
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => (this.fins = data),
        complete: () => {
          this.loading = false;
        },
      })
  }

  /// SET METHODES EVALUATION
  setMethodesEvaluation(data: any) {
    this.methodesEvaluation = data;
  }

  /// LOAD METHODES EVALUATION
  loadMethodesEvaluation() {
    this.refreshEvent.emit(null);
  }

  /// SAVE VALORISATION
  saveValorisation() {
    let comite = {
      id: this.valuationSaveForm.controls['id'].value,
      projet: { id: this.selectedProject.id },
      fonds: { id: this.fonds()?.id },
      annee: this.year(),
      titres: this.valuationSaveForm.controls['titres'].value,
      fondsTitres: this.valuationSaveForm.controls['fondsTitres'].value,
      capital: this.valuationSaveForm.controls['capital'].value,
      fondsCapital: this.valuationSaveForm.controls['fondsCapital'].value,
      cout: this.valuationSaveForm.controls['cout'].value,
      valeur: this.valuationSaveForm.controls['valeur'].value,
      valeurAction: this.valuationSaveForm.controls['valeurAction'].value,
      pmValues: this.valuationSaveForm.controls['pmValues'].value,
      methodeEvaluation: this.valuationSaveForm.controls['methodeEvaluation'].value,
    };

    this.managementService
      .saveComiteValorisation(comite)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.toastr.success('Comité de valorisation sauvegardé avec succès!');
          this.valuationSaveForm.reset();
          this.valuationSaveForm.patchValue({ id: null });
          this.loadComitesValorisation();
          this.fins = undefined;
          this.selectedProject = undefined;
          this.opened = false;
        },
        error: (error) => {
          console.error('Erreur lors de la sauvegarde:', error);
          this.toastr.error(
            'Erreur lors de la sauvegarde, veuillez contacter l\'administrateur de l\'application'
          );
        },
      });
  }
  /// EDIT
  edit(cv: any) {
    this.valuationSaveForm.reset();
    this.valuationSaveForm.patchValue({
      id: cv.id,
      annee: cv.annee,
      fonds: cv.fonds,
      projet: cv.projet,
      titres: cv.titres,
      fondsTitres: cv.fondsTitres,
      capital: cv.capital,
      fondsCapital: cv.fondsCapital,
      cout: cv.cout,
      valeur: cv.valeur,
      valeurAction: cv.valeurAction,
      pmValues: cv.pmValues,
      methodeEvaluation: cv.methodeEvaluation,
    });
    this.opened = true;
  }

  /// DELETE
  delete(cv: any) {
    if (confirm('Veuillez confirmer cette suppression!')) {
      this.managementService.deleteComiteValorisation(cv.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success(
              '',
              'Comote de valorisation suprrimé avec succès'
            );
            this.loadComitesValorisation();
            this.fins = undefined;
          },
          error: () =>
            this.toastr.error(
              '',
              "Suppression èchouée, veuillez contacter l'administrateur de l'application"
            ),
        })
    }
  }


  /// MODAL VALORISATION
  showValorisationModal() {
    this.valuationSaveForm.reset();
    this.opened = true;
  }

  /// MODAL METHODE EVALUATION
  showMethodeForm() {
    this.openedMethodeEvaluationForm.set(true);
  }

  /// MODAL DOCUMENT
  showDocumentModal() {
    this.openedDocumentModal.set(true);
  }

  /// EQUALS
  equals(a: any, b: any) {
    return a?.id == b?.id;
  }

  /// COLLAPSE
  collapse() {
    this.collapsed = true;
  }

  modalClose() {
    this.openedMethodeEvaluationForm.set(false);
  }
  /// EXTEND
  extend() {
    this.collapsed = false;
  }


}
