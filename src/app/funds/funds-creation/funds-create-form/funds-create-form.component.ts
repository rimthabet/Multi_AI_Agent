import { Component, DestroyRef, inject, input, OnInit, output, effect } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'funds-create-form',

  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, CurrencyPipe],
  providers: [DatePipe],
  templateUrl: './funds-create-form.component.html',
  styleUrl: './funds-create-form.component.scss'
})
export class FundsCreateFormComponent implements OnInit {
  // ===== INPUTS =====
  fonds = input<any>();

  // ===== OUTPUT =====
  refreshEvent = output<any>();


  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly datePipe = inject(DatePipe);

  // ===== FORMS =====
  fundSaveForm!: FormGroup;

  // ===== TABLE DATA =====
  natures: any[] = [];
  forme_legales: any[] = [];
  cadresInvestissement: any[] = [];
  banques: any[] = [];

  // ===== PROPERTIES =====
  ratioType: string = 'ratio_reglementaire_souscripteur';
  createdFund: any | undefined;
  _fonds: any | undefined;


  // ===== INITIALIZE =====
  ngOnInit(): void {
    this.initForm();
    this.loadNatures();
    this.loadFormeLegales();
    this.loadCadresInvestissement();
    this.loadBanques();


  }

  /// FONDS EFFECT
  readonly fondsEffect = effect(() => {
    if (this.fonds()) {
      this._fonds = this.fonds();
      this.setFundForm();
    }
  });

  /// SET FUND FORM
  setFundForm(data?: any) {
    const fonds = data || this._fonds;
    /// PATCH VALUE
    this.fundSaveForm.patchValue({
      denomination: fonds?.denomination,
      alias: fonds?.alias,
      montant: fonds?.montant,
      duree: fonds?.duree,
      date_agrement: fonds?.dateAgrement
        ? this.datePipe.transform(new Date(fonds?.dateAgrement), 'dd/MM/yyyy')
        : '',

      date_lancement: fonds?.dateLancement
        ? this.datePipe.transform(new Date(fonds?.dateLancement), 'dd/MM/yyyy')
        : '',

      date_expiration: fonds?.dateExpiration
        ? this.datePipe.transform(new Date(fonds?.dateExpiration), 'dd/MM/yyyy')
        : '',

      date_visa_cmf: fonds?.dateVisaCMF
        ? this.datePipe.transform(new Date(fonds?.dateVisaCMF), 'dd/MM/yyyy')
        : '',


      num_visa_cmf: fonds?.numVisaCMF,
      matriculeFiscal: fonds?.matriculeFiscal,
      banque: this.banques?.find(b => b.id === fonds?.banque?.id),
      adresseFonds: fonds?.adresseFonds,
      frais_depositaire: fonds?.fraisDepositaire,
      frais_gestion: fonds?.fraisGestion,
      nature: this.natures?.find(n => n.id === fonds?.nature?.id),
      forme_legale: this.forme_legales?.find(fl => fl.id === fonds?.formeLegale?.id),
      cadre_investissement: fonds?.cadresInvestissement,
      ratio_reglementaire: fonds?.ratioReglementaire,
      ratio_reglementaire_2: fonds?.ratioReglementaire2,
      ratio_secteur_activite: fonds?.ratioSecteurActivite,
      ratio_societe: fonds?.ratioSociete,
      ratio_quasi_fond_propre: fonds?.ratioQuasiFondPropre,
      ratio_conformite_oca: fonds?.ratioConformiteOCA,
      ratio_investissement: fonds?.ratioInvestissement,
      nombre_annees: fonds?.nombreAnnees ?? 2,
    });

  }


  // ===== FORM =====
  initForm() {
    this.fundSaveForm = this.formBuilder.group({
      denomination: [undefined, [Validators.required]],
      alias: [undefined, [Validators.required]],
      montant: [undefined, [Validators.required]],
      adresseFonds: ['', [Validators.required]],
      duree: [10, [Validators.required]],

      date_agrement: [undefined, Validators.required],
      date_lancement: [undefined, Validators.required],
      date_expiration: [undefined, Validators.required],
      date_visa_cmf: [undefined, [Validators.required]],

      num_visa_cmf: [undefined, [Validators.required]],
      matriculeFiscal: ['', [Validators.required]],
      banque: [undefined, [Validators.required]],

      frais_depositaire: [undefined, [Validators.required]],
      frais_gestion: [undefined, [Validators.required]],
      nature: [undefined, [Validators.required]],
      forme_legale: [undefined, [Validators.required]],
      cadre_investissement: [undefined],
      ratio_reglementaire: [undefined],
      ratio_reglementaire_2: [undefined],
      ratio_secteur_activite: [undefined],
      ratio_societe: [undefined],
      ratio_quasi_fond_propre: [undefined],
      ratio_conformite_oca: [undefined],
      ratio_investissement: [undefined],
      nombre_annees: [2],
    })

  }

  // ===== LOAD NATURES =====
  loadNatures() {
    this.managementService
      .findNatures()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => (this.natures = data),
        error: (error) => console.error(error),
      });
  }

  // ===== LOAD FORME LEGALES =====
  loadFormeLegales() {
    this.managementService
      .findForme()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => (this.forme_legales = data),
        error: (error) => console.error(error),
      });
  }

  // ===== LOAD CADRES INVESTISSEMENT =====
  loadCadresInvestissement() {
    this.managementService
      .findCadreInvestissement()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => (this.cadresInvestissement = data),
        error: (error) => console.error(error),
      });
  }

  // ===== LOAD BANQUES =====
  loadBanques() {
    this.managementService
      .findBanque()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => (this.banques = data),
        error: (error) => console.error(error),
      });
  }

  // ===== SAVE FUND =====
  saveFund() {
    const [d1, m1, y1] = this.fundSaveForm?.value['date_agrement'].split('/');
    const dateAgrement = new Date(y1, m1 - 1, d1);

    const [d2, m2, y2] = this.fundSaveForm?.value['date_lancement'].split('/');
    const dateLancement = new Date(y2, m2 - 1, d2);

    const [d3, m3, y3] = this.fundSaveForm?.value['date_expiration'].split('/');
    const dateExpiration = new Date(y3, m3 - 1, d3);

    const [d4, m4, y4] = this.fundSaveForm?.value['date_visa_cmf'].split('/');
    const dateVisaCMF = new Date(y4, m4 - 1, d4);

    let fund: any = {
      denomination: this.fundSaveForm?.value['denomination'],
      alias: this.fundSaveForm?.value['alias'],
      montant: this.fundSaveForm?.value['montant'],
      duree: this.fundSaveForm?.value['duree'],
      dateAgrement: dateAgrement,
      dateLancement: dateLancement,
      dateExpiration: dateExpiration,
      dateVisaCMF: dateVisaCMF,
      numVisaCMF: this.fundSaveForm?.value['num_visa_cmf'],
      matriculeFiscal: this.fundSaveForm?.value['matriculeFiscal'],
      // Correction: utiliser directement la valeur du formulaire
      banque: this.fundSaveForm?.value['banque'],
      adresseFonds: this.fundSaveForm?.value['adresseFonds'],
      fraisDepositaire: this.fundSaveForm?.value['frais_depositaire'],
      fraisGestion: this.fundSaveForm?.value['frais_gestion'],
      // Correction: utiliser directement la valeur du formulaire
      nature: this.fundSaveForm?.value['nature'],
      // Correction: utiliser directement la valeur du formulaire
      formeLegale: this.fundSaveForm?.value['forme_legale'],
      cadresInvestissement: this.fundSaveForm?.value['cadre_investissement'],
      ratioReglementaire: this.fundSaveForm?.value['ratio_reglementaire'],
      ratioReglementaire2: this.fundSaveForm?.value['ratio_reglementaire_2'],
      ratioSecteurActivite: this.fundSaveForm?.value['ratio_secteur_activite'],
      ratioSociete: this.fundSaveForm?.value['ratio_societe'],
      ratioQuasiFondPropre: this.fundSaveForm?.value['ratio_quasi_fond_propre'],
      ratioConformiteOCA: this.fundSaveForm?.value['ratio_conformite_oca'],
      ratioInvestissement: this.fundSaveForm?.value['ratio_investissement'],
      nombreAnnees: this.fundSaveForm?.value['nombre_annees'],
    };

    // Si mise à jour, ajouter l'ID
    if (this._fonds) {
      fund.id = this._fonds.id;
    }

    // Appeler le bon service
    if (this._fonds) {
      // Mise à jour
      this.managementService.updateFonds(fund).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (result: any) => {
          this.toastr.success('Fonds mis à jour avec Succès!');
          this.refreshEvent.emit(result);
        },
        error: (error) => {
          console.error(error);
        }
      });
    } else {
      // Création
      this.managementService.saveFonds(fund).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (result: any) => {
          this.toastr.success('Fonds Ajouté avec Succès!');
          this.refreshEvent.emit(result);
          this.createdFund = result;
        },
        error: (error) => {
          console.error(error);
        }
      });
    }
  }

  // ===== GET LABEL FOR RATIO TYPE =====
  getLabelForRatioType(ratioType: string): string {
    switch (ratioType) {
      case 'ratio_reglementaire_souscripteur':
        return 'Ratio réglementaire (Souscripteurs):';
      case 'ratio_emploi_fiscale':
        return 'Avantage fiscal:';
      default:
        return '';
    }
  }


  // ===== EQUALS =====
  equals(a: any, b: any) {
    return a?.id == b?.id;
  }
}
