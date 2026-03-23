import { Component, DestroyRef, effect, inject, input, OnInit, viewChild, viewChildren } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VestingCreateFormComponent } from "../vesting-create-form/vesting-create-form.component";
import { DocumentUploadComponent } from "../../../../tools/document-upload/document-upload.component";
import { DatePipe } from '@angular/common';
import { OcaConvertionCreateFormComponent } from "./oca-convertion-create-form/oca-convertion-create-form.component";
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { OcaBankAccountFormComponent } from "./oca-bank-account-form/oca-bank-account-form.component";

@Component({
  selector: 'oca-create-form',
  imports: [ClarityModule, CdsModule, ReactiveFormsModule, FormsModule, DecimalPipe, CurrencyPipe, DatePipe, DocumentUploadComponent, OcaConvertionCreateFormComponent, VestingCreateFormComponent, OcaBankAccountFormComponent],
  providers: [DatePipe],
  templateUrl: './oca-create-form.component.html',
  styleUrls: ['../shares-create-form/shares-create-form.component.scss']
})
export class OcaCreateFormComponent implements OnInit {

  fonds = input<any>();
  financement = input<any>();

  ocaConversionForm = viewChild<OcaConvertionCreateFormComponent>("ocaConversionForm");
  docUploads = viewChildren<DocumentUploadComponent>("doc_upload");

  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly datePipe = inject(DatePipe);

  souscription_conformite_documentaire: any[] = [];
  conversion_conformite_documentaire: any[] = [];

  bulletin_souscription_link: string | undefined;
  ocaSaveForm!: FormGroup;

  souscription: any | undefined;

  indexees: any[] = [
    { label: 'CA', value: 0 },
    { label: 'MARGES', value: 1 },
    { label: 'EBITDA', value: 2 },
    { label: 'EBIT', value: 3 },
    { label: 'RN', value: 4 },
  ];

  valeurAction: number | undefined;
  actionsConverties: number = 0;
  montant: number = 0;

  conversion: any | undefined;

  loading: boolean = true;
  openedBulletinSubscription: boolean = false;
  conversion_modal_open: boolean = false;
  show_isa = false;
  openedBankAccount: boolean = false;

  ngOnInit(): void {
    this.ocaSaveForm = this.formBuilder.group({
      date_bulletin_souscription: [undefined, [Validators.required]],
      montant: [undefined, [Validators.required]],
      taux_oca: [0, [Validators.required]],
      maturite: [undefined, [Validators.required]],
      nombre_oca: [undefined, [Validators.required]],
      valeur_nominale_oca: [undefined, [Validators.required]],
      indexee: [0, [Validators.required]],
    });

    this.loadConformiteDocuments();
    this.loadSouscription();
    this.loadConversion();
  }

  readonly financementEffect = effect(() => {
    if (this.financement()) {
      this.loadSouscription();
    }
  });

  loadConformiteDocuments() {
    this.managementService.findConformitesByTache(3, 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => this.souscription_conformite_documentaire = data,
        error: (error) => console.error(error),
      });

    this.managementService.findConformitesByTache(3, 7)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => this.conversion_conformite_documentaire = data,
        error: (error) => console.error(error),
      });
  }

  loadSouscription() {
    this.loading = true;
    this.managementService.findInvSoucriptionByFinancementAndFonds(
      this.financement().id,
      this.fonds().id,
      'oca'
    ).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          if (data != null) {
            this.souscription = data;
            this.initFormSouscription(data);
            if (data.documents?.length > 0) {
              this.bulletin_souscription_link = data.documents.reverse()[0].chemin;
            }
            this.valeurAction = data.nominal;
            this.actionsConverties = Math.trunc(data.montant / this.valeurAction!);
          }
        },
        complete: () => this.loading = false,
      });
  }

  saveSouscription() {
    this.loading = true;
    const [d1, m1, y1] = this.ocaSaveForm?.value['date_bulletin_souscription'].split('/');
    let souscription = {
      id: this.souscription ? this.souscription.id : null,
      financement: this.financement(),
      fonds: this.fonds(),
      dateBulletin: new Date(+y1, +m1 - 1, +d1),
      montant: this.ocaSaveForm?.value['montant'],
      taux: this.ocaSaveForm?.value['taux_oca'],
      maturite: this.ocaSaveForm?.value['maturite'],
      nombreOCA: this.ocaSaveForm?.value['nombre_oca'],
      nominal: this.ocaSaveForm?.value['valeur_nominale_oca'],
      index: this.ocaSaveForm?.value['indexee'],
    };

    this.managementService.saveInvSouscription(souscription, 'oca')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.toastr.success('Souscription en OCA sauvegardée avec succès!');
          this.souscription = data;
        },
        complete: () => this.loading = false,
      });
  }

  initFormSouscription(data?: any) {
    if (!data) {
      data = this.souscription;
    } else {
      this.souscription = data;
    }

    this.ocaSaveForm.patchValue({
      id: this.souscription?.id,
      date_bulletin_souscription: this.souscription?.dateBulletin
        ? this.datePipe.transform(new Date(this.souscription.dateBulletin), 'dd/MM/yyyy')
        : '',
      montant: this.souscription?.montant,
      taux_oca: this.souscription?.taux,
      maturite: this.souscription?.maturite,
      nombre_oca: this.souscription?.nombreOCA,
      valeur_nominale_oca: this.souscription?.nominal,
      indexee: this.souscription?.index,
    });
  }

  deleteSouscription() {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService.deleteSouscriptionAction(this.souscription?.id, 'oca')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('Suppression de souscription OCA avec succès!');
            this.ocaSaveForm.reset();
          },
          error: (error) => console.error(error),
        });
    }
  }

  openBulletinLink() {
    if (this.bulletin_souscription_link) {
      window.open(this.bulletin_souscription_link, '_blank');
    }
  }

  refreshEvent(conversion: any) {
    this.conversion = conversion ?? undefined;
  }

  loadConversion() {
    this.managementService.findConversionByFinancementAndFonds(
      this.financement()?.id,
      this.fonds()?.id,
      'oca'
    ).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: any) => {
        if (data != null) {
          this.conversion = data;
        }
      });
  }

  deleteConversion() {
    this.ocaConversionForm()?.deleteConversion();
  }

  openBulletinSubscription() {
    this.openedBulletinSubscription = true;
  }

  showBankAccountModal() {
    this.openedBankAccount = true;
  }

}
