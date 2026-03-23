import { Component, DestroyRef, effect, inject, input, OnInit, viewChild, viewChildren } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, } from '@angular/forms';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VestingCreateFormComponent } from "../vesting-create-form/vesting-create-form.component";
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { CcaConvertionCreateFormComponent } from "./cca-convertion-create-form/cca-convertion-create-form.component";
import { CcaSettlementCreateFormComponent } from "./cca-settlement-create-form/cca-settlement-create-form.component";
import { DocumentUploadComponent } from "../../../../tools/document-upload/document-upload.component";

@Component({
  selector: 'cca-create-form',

  imports: [ClarityModule, CdsModule, ReactiveFormsModule, FormsModule, DecimalPipe, DatePipe, CurrencyPipe, CcaConvertionCreateFormComponent, VestingCreateFormComponent, CcaSettlementCreateFormComponent, DocumentUploadComponent],
  providers: [DatePipe],
  templateUrl: './cca-create-form.component.html',
  styleUrls: ['../shares-create-form/shares-create-form.component.scss']
})
export class CcaCreateFormComponent implements OnInit {

  // ===== INPUTS =====
  fonds = input<any>();
  financement = input<any>();

  // ===== VIEWCHILD =====
  docUploads = viewChildren<DocumentUploadComponent>("doc_upload");
  ccaConversionForm = viewChild<CcaConvertionCreateFormComponent>("ccaConversionForm");
  ccaSettlementForm = viewChild<CcaSettlementCreateFormComponent>("ccaSettlementForm");

  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly datePipe = inject(DatePipe);

  // ===== PROPERTIES =====
  souscription_conformite_documentaire: any[] = [];
  conformite_documentaires_conversion: any[] = [];
  conformite_documentaires_reglement: any[] = [];

  loading: boolean = true;
  opened: boolean = false;
  conversion_modal_open: boolean = false;
  reglement_modal_open: boolean = false;
  loadingConversion: boolean = false;
  show_isc: boolean = false;
  show_isr: boolean = false;
  show_subsc: boolean = false;
  openedBulletinSubscription: boolean = false;

  contrat_cca_link: string | undefined;
  souscription: any | undefined;
  conformite_documentaire: any | undefined;

  ccaSaveForm!: FormGroup

  valeurAction: number | undefined;
  actionsConverties: number = 0;
  montant: number = 0;

  conversion: any | undefined;
  reglement: any | undefined;

  // ===== INDEXES =====
  modalite_payments: any[] = [
    { label: 'Trimestrielle', value: 'TRIMESTRIELLE' },
    { label: 'Semestrielle', value: 'SEMESTRIELLE' },
    { label: 'Annuelle', value: 'ANNUELLE' },
  ];

  // ===== INITIALIZATION =====
  ngOnInit(): void {
    // ===== CCA FORM =====
    this.ccaSaveForm = this.formBuilder.group({
      id: null,
      date_signature_contrat: [undefined, [Validators.required]],
      montant_cca: [undefined, [Validators.required]],
      duree: [undefined, [Validators.required]],
      modalite_payment: ['TRIMESTRIELLE', [Validators.required]],
      taux_cca: [0, [Validators.required]],
    });


    // ===== LOAD DATA =====
    this.loadConformiteDocuments();
    this.loadSouscription();
    this.loadConversion();
    this.loadReglement();
  }

  // ===== LOAD CONFORMITE DOCUMENTS =====
  loadConformiteDocuments() {
    // ===== CONFORMITE DOCUMENTAIRES SOUSCRIPTION =====
    this.managementService
      .findConformitesByTache(3, 1)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.souscription_conformite_documentaire = data;
        },
        error: (data: any) => console.log(data),
      })


    // ===== CONFORMITE DOCUMENTAIRES CONVERSION =====
    this.managementService
      .findConformitesByTache(3, 8)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.conformite_documentaires_conversion = data;
        },
        error: (data: any) => console.log(data),
      })


    // ===== CONFORMITE DOCUMENTAIRES REGLEMENT =====
    this.managementService
      .findConformitesByTache(3, 9)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.conformite_documentaires_reglement = data;
        },
        error: (data: any) => console.log(data),
      })

  }


  // ===== EFFECTS FINANCEMENT=====
  readonly financementEffect = effect(() => {
    if (this.financement() && this.fonds()) {
      this.loadSouscription();
    }
  });

  // ===== LOAD SOUSCRIPTION =====
  loadSouscription() {
    this.loading = true;
    this.managementService
      .findInvSoucriptionByFinancementAndFonds(
        this.financement().id,
        this.fonds().id,
        'cca'
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          if (data != null) {
            this.souscription = data;
            this.show_isc = false;
            this.show_isr = false;
            this.initFormSouscription(data);
            if (data.documents && data.documents.length > 0) {
              this.contrat_cca_link = data.documents
                .reverse()[0]
                .chemin;
            }
          }
        },
        complete: () => (this.loading = false),
      })
  }

  // ===== SAVE SOUSCRIPTION =====
  saveSouscription() {
    const [d1, m1, y1] = this.ccaSaveForm?.value['date_signature_contrat'].split('/');
    let souscription = {
      id: this.souscription ? this.souscription.id : null,
      financement: this.financement(),
      fonds: this.fonds(),
      dateSignatureContrat: new Date(
        y1, m1 - 1, d1
      ),
      montant: this.ccaSaveForm?.value['montant_cca'],
      duree: this.ccaSaveForm?.value['duree'],
      modalitePaymentInteret: this.ccaSaveForm?.value['modalite_payment'],
      taux: this.ccaSaveForm?.value['taux_cca'],
    };

    this.managementService
      .saveInvSouscription(souscription, 'cca')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.toastr.success('Souscription en CCA sauvegardée avec succès!');
          this.souscription = data;
        },
        error: (err) => {
          console.error('Erreur lors de la sauvegarde de la souscription :', err);
          this.toastr.error('Erreur lors de la sauvegarde de la souscription', 'Erreur');
        },
      })

  }


  // ===== INIT FORM SOUSCRIPTION =====
  initFormSouscription(data?: any) {
    if (!data) {
      data = this.souscription();
    } else {
      this.souscription = data;
    }
    this.ccaSaveForm?.patchValue({
      date_signature_contrat: this.souscription?.dateSignatureContrat
        ? this.datePipe.transform(new Date(this.souscription.dateSignatureContrat), 'dd/MM/yyyy')
        : '',
      montant_cca: data?.montant,
      duree: data?.duree,
      modalite_payment: data?.modalitePaymentInteret,
      taux_cca: data?.taux,
    });

  }


  // ===== DELETE SOUSCRIPTION =====
  deleteSouscription() {
    if (confirm('Veuillez confirmer cette suppression !')) {

      this.managementService
        .deleteSouscriptionAction(this.souscription?.id, 'cca')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('Suppression de souscription cca avec succès!');
            this.ccaSaveForm.reset();
          },
          error: (err) => {
            console.error('Erreur lors de la suppression de la souscription :', err);
            this.toastr.error('Erreur lors de la suppression de la souscription', 'Erreur');
          }
        })

    }
  }

  // ===== LOAD CONVERSION =====
  loadConversion() {
    this.loadingConversion = true;
    this.managementService
      .findConversionByFinancementAndFonds(
        this.financement()?.id,
        this.fonds()?.id,
        'cca'
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          if (data != null) {
            this.conversion = data;
            this.show_isr = false;
          }
        },
        error: (err) => {
          console.error('Erreur lors de la récupération de la conversion :', err);
          this.toastr.error('Erreur lors de la récupération de la conversion', 'Erreur');
        },
        complete: () => (this.loadingConversion = false),
      })

  }


  // ===== LOAD REGLEMENT =====
  loadReglement() {
    this.managementService
      .findReglementCCAByFinancementAndFonds(
        this.financement()?.id,
        this.fonds()?.id
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.reglement = data;
          this.show_isc = false;
        },
        error: (error) => { console.log(error) },
      })

  }


  // ===== REFRESH EVENT CONVERSION =====
  refreshEventConversion(conversion: any) {
    if (conversion === null || conversion === undefined) {
      // conversion deleted
      this.conversion = undefined;
    } else {
      this.conversion = conversion;
      this.show_isc = true;
    }
  }

  // ===== REFRESH EVENT REGLEMENT =====
  refreshEventReglement(reglement: any) {
    if (reglement === null || reglement === undefined) {
      // conversion deleted
      this.reglement = undefined;
    } else {
      // reglement updated
      this.reglement = reglement;
      this.show_isr = true;
    }
  }


  // ===== DELETE CONVERSION =====
  deleteConversion() {
    if (this.ccaConversionForm()) {
      this.ccaConversionForm()!.deleteConversion();
    }
  }

  // ===== DELETE REGLEMENT =====
  deleteReglement() {
    if (this.ccaSettlementForm()) {
      this.ccaSettlementForm()!.deleteReglement();
    }
  }


  showSouscriptionModal() {
    this.opened = true;
  }
}
