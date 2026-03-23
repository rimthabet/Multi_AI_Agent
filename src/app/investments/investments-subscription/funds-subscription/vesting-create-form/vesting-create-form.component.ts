import { Component, DestroyRef, effect, inject, input, OnInit, viewChildren } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DocumentUploadComponent } from '../../../../tools/document-upload/document-upload.component';
import { CurrencyPipe, DatePipe, DecimalPipe, formatDate } from '@angular/common';

@Component({
  selector: 'vesting-create-form',
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, CurrencyPipe, DatePipe, DecimalPipe, DocumentUploadComponent],
  providers: [DatePipe],

  templateUrl: './vesting-create-form.component.html',
  styleUrl: './vesting-create-form.component.scss'
})
export class VestingCreateFormComponent implements OnInit {

  // ===== INPUT =====
  souscription = input<any>();
  type = input<any>();
  disabled = input<boolean>();

  // ===== VIEWCHILD =====
  docUploads = viewChildren<DocumentUploadComponent>("doc_upload");

  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly datePipe = inject(DatePipe);

  // ===== PROPERTIES =====
  liberationSaveForm!: FormGroup;


  liberations: any[] | undefined;
  liberation_conformite_documentaire: any[] | undefined;
  selectedLiberation: any;

  liberationModal: boolean = false;
  loading: boolean = false;

  ngOnInit(): void {
    // ===== INIT FORM =====
    this.liberationSaveForm = this.formBuilder.group({
      date_liberation: [undefined, Validators.required],
      montant_libere: [undefined, [Validators.required]],
    });

    // ===== LOAD LIBERATIONS =====
    this.loadLiberations();
    this.loadConformiteDocuments();
  }

  // ===== EFFECT =====
  readonly souscriptionEffect = effect(() => {
    if (this.souscription()) {
      this.loadLiberations();
    }
  });


  // ===== LOAD CONFORMITE DOCUMENTS =====
  loadConformiteDocuments() {
    let tache_id = this.type() == 'action' ? 4 : this.type() == 'oca' ? 5 : 6;
    this.managementService
      .findConformitesByTache(3, tache_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => (this.liberation_conformite_documentaire = data),
        error: (data: any) => console.log(data),
      })

  }


  // ===== SAVE LIBERATION =====
  saveLiberation() {
    const [d1, m1, y1] = this.liberationSaveForm?.value['date_liberation'].split('/');

    let liberation = {
      id:
        this.selectedLiberation != undefined ? this.selectedLiberation.id : null,
      document:
        this.selectedLiberation != undefined
          ? this.selectedLiberation.document
          : undefined,
      souscription: this.souscription(),
      montantLiberation: this.liberationSaveForm?.value['montant_libere'],
      dateLiberation: new Date(
        y1, m1 - 1, d1
      ),
    };

    this.managementService
      .saveInvLiberartion(liberation, this.type())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.toastr.success('Libération sauvegardée avec succès!');
          this.liberationModal = false;
          this.loadLiberations();
        },
        error: (data: any) => console.log(data),
      })

  }


  // ===== DELETE LIBERATION =====
  deleteLiberation() {
    if (
      this.selectedLiberation &&
      confirm('Veuillez confirmer cette suppression !')
    ) {

      this.managementService
        .deleteInvLiberartion(this.selectedLiberation, this.type())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('Liberation supprimée avec succès!');
            this.loadLiberations();
          },
          error: (data: any) => console.log(data),
        })

    }
  }


  // ===== LOAD LIBERATIONS =====
  loadLiberations() {
    if (!this.souscription()) return;
    this.managementService
      .findInvLiberationsBySouscription(this.souscription().id, this.type())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.liberations = data;
        },
        error: (data: any) => console.log(data),
      });
  }


  // ===== VERIFY DOCUMENT =====
  verifierLiberationDocument(liberation: any, lcd: any): any {
    let result = { message: '', status: '', url: '' };
    let d = liberation.documents?.reverse()[0];

    if (d != undefined) {
      lcd.documentType.id == d.type.id;

      result.message = d.nomFichier;
      result.status = 'success';

      result.url = (d.chemin as string);

      return result;
    }

    if (lcd.qualification == 'OBLIGATOIRE') {
      result.message = 'Document manquant!';
      result.status = 'failure';

      return result;
    }
  }


  // ===== SHOW LIBERATION MODAL =====
  showLiberationModal(clear: boolean) {
    if (clear) {
      this.selectedLiberation = undefined;
      this.liberationSaveForm.reset();
    }

    if (this.selectedLiberation) {
      this.liberationSaveForm.patchValue({
        id: this.selectedLiberation.id,
        souscription: this.selectedLiberation.souscription,
        date_liberation: this.selectedLiberation.dateLiberation
          ? this.datePipe.transform(new Date(this.selectedLiberation.dateLiberation), 'dd/MM/yyyy')
          : '',
        montant_libere: this.selectedLiberation.montantLiberation,
      });
    }

    this.liberationModal = true;
  }


  // ===== HIDE MODAL =====
  hideModal() {
    this.liberationModal = false;
  }


  // ===== DELETE DOCUMENT =====
  supprimerDocument(liberation: any) {
    if (confirm('Êtes-vous sûr de vouloir supprimer?')) {

      this.managementService
        .deleteDocument(liberation?.documents?.reverse()[0].id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('', 'Document supprimé avec succès!');
            liberation?.documents?.reverse().splice(-1);

            this.docUploads()
              ?.filter(
                (ud: DocumentUploadComponent) => ud.data().id === liberation.id
              )![0]
              .refresh();

          },
          error: (data: any) => console.log(data),
        })

    }
  }



}
