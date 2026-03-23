import { Component, DestroyRef, inject, model, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../services/management.service';
import { FinancingPlanComponent } from "./financing-plan/financing-plan.component";
import { CdsButtonModule, CdsDividerModule, CdsIconModule } from '@cds/angular';
import { ClrModalModule } from '@clr/angular';
import { ClarityModule } from '@clr/angular';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'financing-plans',
  imports: [ClrModalModule, ClarityModule, CdsButtonModule, FormsModule, ReactiveFormsModule, CdsIconModule, CurrencyPipe, CdsDividerModule, FinancingPlanComponent],
  providers: [DatePipe],
  templateUrl: './financing-plans.component.html',
  styleUrl: './financing-plans.component.scss'
})
export class FinancingPlansComponent implements OnInit {

  // inputs
  prospection = model<any>();
  loading = model<boolean>(false);

  loading1: boolean = false;
  loading2: boolean = false;
  loading3: boolean = false;

  // injects
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly datePipe = inject(DatePipe);

  // forms
  financementSaveForm!: FormGroup;
  financementModifForm!: FormGroup;

  financements: any[] | undefined;
  formes: any[] | undefined;
  funds: any[] = [];
  naturesInvestissement: any[] = [];
  selectedFonds: any[] = [];

  montant: number | undefined;
  financingFormModalOpened: boolean = false;

  // lifecycle hooks
  ngOnInit(): void {

    // init forms modif
    this.financementModifForm = this.formBuilder.group({
      financement: [undefined, [Validators.required]],
    });

    // init forms save
    this.financementSaveForm = this.formBuilder.group({
      dateDemandeFinancement: [undefined, [Validators.required]],
      financementCCA: [undefined, [Validators.required]],
      financementOCA: [undefined, [Validators.required]],
      financementActions: [undefined, [Validators.required]],
      montant: [undefined, [Validators.required]],
      funds: [undefined, [Validators.required]],
      natureInvestissements: [undefined, [Validators.required]],
    });

    this.loadFundsList();
    this.loadNaturesInvestissement();
    this.loadFinancement();


    // init form modif
    this.financementModifForm
      .get('financement')
      ?.valueChanges.subscribe((value) => {
        this.initForm(value);
      });

  }


  // load funds list
  loadFundsList() {
    this.loading1 = true;
    this.loading.set(true);

    this.managementService.findFondsList().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {

        this.funds = data.filter(
          (fonds: any) =>
            fonds?.etat?.libelle !== 'En cours de levée' ||
            (fonds.sousLib?.length > 0 &&
              fonds.sousLib?.filter(
                (sl: any) =>
                  sl.souscription != null && sl.liberations?.length > 0
              ).length > 0)
        );

      },
      complete: () => { this.loading1 = false; this.setLoading() },
      error: (data: any) => {
        this.loading1 = false;
      },
    })
  }


  // load natures investissement
  loadNaturesInvestissement() {

    this.loading2 = true;
    this.loading.set(true);

    this.managementService.findNatureInvestissement().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.naturesInvestissement = data;
      },
      complete: () => { this.loading2 = false; this.setLoading(); },
      error: (data: any) => {
        console.error(data);
      },
    })
  }


  // load financement
  loadFinancement() {
    this.loading3 = true;
    this.loading.set(true);

    this.managementService
      .findFinancementByProjectId(this.prospection()?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.financements = data;
          this.financementModifForm.controls['financement'].patchValue(data[0]);
        },
        complete: () => { this.loading3 = false; this.setLoading(); },
        error: (data: any) => { console.error(data); },
      })
  }


  openNewFinancingModal() {
    // Réinitialiser le formulaire de modification
    this.financementModifForm.controls['financement'].setValue(undefined);

    // Réinitialiser le formulaire de sauvegarde avec des valeurs par défaut
    this.financementSaveForm.reset({
      dateDemandeFinancement: undefined,
      financementCCA: undefined,
      financementOCA: undefined,
      financementActions: undefined,
      montant: undefined,
      funds: undefined,
      natureInvestissements: undefined
    });

    // Ouvrir le modal
    this.financingFormModalOpened = true;
  }

  editFinancement(financingPlan: any) {
    this.financementModifForm.controls['financement'].setValue(financingPlan);
    this.initForm(financingPlan);
    this.financingFormModalOpened = true;
  }

  deleteFinancing(deletedFinancing: any) {
    this.financements = this.financements!.filter(
      (fin: any) => fin.id !== deletedFinancing.id
    );
    if (this.financementModifForm.controls['financement'].value?.id === deletedFinancing.id) {
      this.financementModifForm.reset();
      this.financementSaveForm.reset();
    }
  }

  initForm(data?: any) {
    if (data) {
      let financementData = data;
      this.financementSaveForm.patchValue({
        dateDemandeFinancement: this.datePipe.transform(financementData.dateDemandeFinancement, 'dd/MM/yyyy'),
        financementCCA: financementData.financementCCA,
        financementOCA: financementData.financementOCA,
        financementActions: financementData.financementActions,
        montant: financementData.montant,
        funds: financementData.fonds,
        natureInvestissements: financementData.naturesInvestissement
      });

      this.montant = financementData.montant ?? 0;
    } else {
      this.financementSaveForm.reset({
        dateDemandeFinancement: undefined,
        financementCCA: undefined,
        financementOCA: undefined,
        financementActions: undefined,
        montant: undefined,
        funds: undefined,
        natureInvestissements: undefined
      });
      this.montant = 0;
    }
  }

  // save financement
  saveFinancement() {
    const [d1, m1, y1] = this.financementSaveForm?.value['dateDemandeFinancement'].split('/');
    if (this.financementSaveForm?.invalid) {
      this.toastr.error('Veuillez remplir tous les champs obligatoires.', 'Erreur de validation');
      return;
    }

    let financement: any = {
      dateDemandeFinancement: new Date(y1, m1 - 1, d1),
      financementCCA: this.financementSaveForm?.value['financementCCA'],
      financementOCA: this.financementSaveForm?.value['financementOCA'],
      financementActions: this.financementSaveForm?.value['financementActions'],
      montant:
        Number.parseFloat(this.financementSaveForm?.value['financementCCA']) +
        Number.parseFloat(this.financementSaveForm?.value['financementOCA']) +
        Number.parseFloat(
          this.financementSaveForm?.value['financementActions']
        ),
      projet: this.prospection(),
      fonds: this.financementSaveForm?.value['funds'],
      naturesInvestissement:
        this.financementSaveForm?.value['natureInvestissements'],
    };

    if (!this.financementModifForm.controls['financement'].value) {
      this.loading.set(true);
      this.managementService.saveFinancement(financement).subscribe({
        next: (data: any) => {
          if (data != null) {
            this.toastr.success('', 'Financement ajouté avec Succès!');
            this.financingFormModalOpened = false;
            this.financementSaveForm.reset();
            this.loadFinancement();
            this.financementModifForm.controls['financement'].patchValue(data);
          }
        },
        error: (error) => {
          this.toastr.error(
            '',
            "Erreur de création du plan de financement! Vérifiez que cette date n'est utilisée par un autre plan!"
          );
        },
        complete: () => this.setLoading(),
      });
    } else {
      financement.id = this.financementModifForm.controls['financement'].value.id;

      this.loading.set(true);
      this.managementService.updateFinancement(financement).subscribe({
        next: (data: any) => {
          if (data != null) {
            this.toastr.success('', 'Financement mis à jour avec succès!');
            this.financingFormModalOpened = false;
            this.loadFinancement();
            this.financementSaveForm.reset();
          } else {
            this.toastr.error(
              '',
              'Erreur de mise à jour du plan de financement! \n' +
              "Vérifiez que cette date n'est utilisée par un autre plan! \n" +
              "Si vous avez changé la liste des fonds, verifiez qu'un des fonds écartés n'ait une participation déja paramétrée et allez la supprimer avant!"
            );
          }
        },
        complete: () => this.setLoading(),
        error: (error) => {
          this.toastr.error(
            '',
            'Erreur de mise à jour du plan de financement! \n' +
            "Vérifiez que cette date n'est utilisée par un autre plan! \n" +
            "Si vous avez changé la liste des fonds, verifiez qu'un des fonds écartés n'ait une participation déja paramétrée et allez la supprimer avant!"
          );
        },
      });
    }
  }


  // calculate total amount
  calculMontant() {
    let somme: number = 0;
    if (this.financementSaveForm?.value['financementCCA'] != null)
      somme += Number.parseFloat(
        this.financementSaveForm?.value['financementCCA']
      );

    if (this.financementSaveForm?.value['financementOCA'] != null)
      somme += Number.parseFloat(
        this.financementSaveForm?.value['financementOCA']
      );

    if (this.financementSaveForm?.value['financementActions'] != null)
      somme += Number.parseFloat(
        this.financementSaveForm?.value['financementActions']
      );
    this.financementSaveForm.controls['montant'].setValue(somme);
  }

  setLoading() {
    this.loading.set(this.loading1 || this.loading2 || this.loading3);
  }

  // equals
  equals(a: any, b: any) {
    return a?.id == b?.id;
  }
}
