import { Component, DestroyRef, effect, inject, input, OnInit, viewChildren } from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { DocumentUploadComponent } from "../../../../tools/document-upload/document-upload.component";
import { VestingCreateFormComponent } from "../vesting-create-form/vesting-create-form.component";
import { SharesBankAccountFormComponent } from "./shares-bank-account-form/shares-bank-account-form.component";

@Component({
  selector: 'shares-create-form',

  imports: [ClarityModule, CdsModule, ReactiveFormsModule, FormsModule, CurrencyPipe, DecimalPipe, DocumentUploadComponent, VestingCreateFormComponent, SharesBankAccountFormComponent],
  providers: [DatePipe],
  templateUrl: './shares-create-form.component.html',
  styleUrl: './shares-create-form.component.scss'
})
export class SharesCreateFormComponent implements OnInit {
  // ===== INPUT =====
  fonds = input<any>();
  financement = input<any>();

  // ===== VIEWCHILD =====
  docUploads = viewChildren<DocumentUploadComponent>("doc_upload");

  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly datePipe = inject(DatePipe);

  // ===== PROPERTIES =====
  actionSaveForm!: FormGroup;

  souscription: any | undefined;

  conformite_documentaire: any[] | undefined;
  bulletin_souscription_link: string | undefined;

  loading: boolean = true;
  openedBulletin: boolean = false;
  openedBankAccount: boolean = false;


  // ===== INITIALIZATION =====
  ngOnInit(): void {

    // ===== ACTION FORM =====
    this.actionSaveForm = this.formBuilder.group({
      id: null,
      date_bulletin_souscription: [null],
      montant: [undefined, [Validators.required]],
      nombre_action: [undefined, [Validators.required]],
      valeur_nominale: [undefined, [Validators.required]],
      prime: [undefined, [Validators.required]],
    });

    // ===== LOAD DATA =====
    this.loadSouscription();
    this.loadConformiteDocuments();

  }


  // ===== EFFECTS FINANCEMENT=====
  readonly financementEffect = effect(() => {
    if (this.financement()) {
      this.loadSouscription();
    }
  });


  // ===== CONFORMITE DOCUMENTS =====
  loadConformiteDocuments() {
    this.managementService.findConformitesByTache(3, 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.conformite_documentaire = data;
        },
        error: (data: any) => console.log(data),
      })
  }


  // ===== LOAD SUBSCRIPTION =====
  loadSouscription() {
    this.loading = true;
    this.managementService
      .findInvSoucriptionByFinancementAndFonds(
        this.financement()?.id,
        this.fonds()?.id,
        'action'
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.souscription = data;
          this.initSouscription(data);
          if (data?.documents && data.documents.length > 0) {
            this.bulletin_souscription_link = data.documents.reverse()[0].chemin;
          } else {
            this.bulletin_souscription_link = undefined;
          }
        },
        complete: () => (this.loading = false),
      });
  }


  // ===== SET SUBSCRIPTION ACTION =====
  initSouscription(data: any) {
    this.initFormSouscription(data);
  }


  // ===== INIT SUBSCRIPTION FORM ACTION =====
  initFormSouscription(data?: any) {
    if (!data) {
      data = this.souscription;
    } else {
      this.souscription = data;
    }
    if (this.souscription) {
      this.actionSaveForm.patchValue({
        id: this.souscription?.id,
        date_bulletin_souscription: this.souscription?.dateBulletin
          ? this.datePipe.transform(new Date(this.souscription.dateBulletin), 'dd/MM/yyyy')
          : '',

        montant: this.souscription?.montant,
        nombre_action: this.souscription?.actions,
        valeur_nominale: this.souscription?.nominal,
        prime: this.souscription?.primeEmission,
      });
    }
  }


  // ===== SAVE SUBSCRIPTION ACTION =====
  saveAction() {
    this.loading = true;
    const [d1, m1, y1] = this.actionSaveForm?.value['date_bulletin_souscription'].split('/');

    let dateBulletin = new Date(y1, m1 - 1, d1);

    let souscription = {
      id: this.souscription ? this.souscription.id : null,
      financement: this.financement(),
      fonds: this.fonds(),
      dateBulletin: dateBulletin,
      montant: this.actionSaveForm?.value['montant'],
      actions: this.actionSaveForm?.value['nombre_action'],
      nominal: this.actionSaveForm?.value['valeur_nominale'],
      primeEmission: this.actionSaveForm?.value['prime'],
    };

    this.managementService
      .saveInvSouscription(souscription, 'action')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.toastr.success(
            'Souscription en actions sauvegardée avec succès!'
          );
          this.souscription = data;
          this.initFormSouscription(data);
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur lors de la sauvegarde de la souscription :', err);
          this.toastr.error('Erreur lors de la sauvegarde de la souscription', 'Erreur');
          this.loading = false;
        }
      });
  }



  // ===== DELETE SUBSCRIPTION ACTION =====
  deleteSouscription() {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService
        .deleteSouscriptionAction(this.souscription?.id, 'action')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success(
              'Suppression de souscription action avec succès!'
            );
          },
          error: (err) => {
            console.error('Erreur lors de la suppression de la souscription :', err);
            this.toastr.error('Erreur lors de la suppression de la souscription', 'Erreur');
          }
        })

    }
  }


  // ===== SHOW COMPTES BANCAIRES =====
  showCompteBancaireMondel() {
    this.openedBankAccount = true;
  }

  // ===== SHOW BULLETIN =====
  showBulletin() {
    this.openedBulletin = true;

  }

  // Format date
  public formatDate(date: any, format = 'yyyy-MM-dd'): string | null {
    if (!date) return null;
    if (date.includes?.('/')) {
      const [d, m, y] = date.split('/');
      date = new Date(y, m - 1, d);
    }
    return this.datePipe.transform(date, format);
  }

  // ===== OPEN BULLETIN =====
  openBulletin() {
    if (this.bulletin_souscription_link) {
      window.open(this.bulletin_souscription_link, '_blank');
    }
  }
}
