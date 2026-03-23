import { Component, DestroyRef, effect, inject, input, OnInit, output } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { DocumentUploadComponent } from "../../../tools/document-upload/document-upload.component";

@Component({
  selector: 'comite-create-form',
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, DocumentUploadComponent],
  providers: [DatePipe],
  templateUrl: './comite-create-form.component.html',
  styleUrl: './comite-create-form.component.scss'
})
export class ComiteCreateFormComponent implements OnInit {

  // ===== INPUTS =====
  fonds = input<any>();
  comite = input<any>();
  create = input<boolean>(false);

  // ===== OUTPUTS =====
  refreshEvent = output<any>();

  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly datePipe = inject(DatePipe);

  // ===== PROPERTIES =====
  comiteSaveForm!: FormGroup

  conformite_documentaires: any[] = [];
  selectedComite: any | undefined;
  savedComiteStrategie: any | undefined;

  // ===== INITIALIZE =====
  ngOnInit(): void {
    this.initForm();
    this.loadConformiteDocumentaires();
  }

  // ===== FORM =====
  initForm() {
    this.comiteSaveForm = this.formBuilder.group({
      dateComite: [undefined, [Validators.required]],
      commentaires: [undefined, [Validators.required]],
    });
  }

  // ===== SET COMITE =====
  setComite(comite: any) {
    if (comite) {
      this.selectedComite = comite;
      this.comiteSaveForm.patchValue({
        dateComite: comite?.dateComite
          ? this.datePipe.transform(new Date(comite.dateComite), 'dd/MM/yyyy')
          : '',
        commentaires: comite.commentaires,
      });
    }
  }

  // ===== EFFECTS =====
  readonly comiteEffect = effect(() => {
    if (this.comite()) {
      this.setComite(this.comite());
    }
  });

  // ===== LOAD CONFORMITE DOCUMENTAIRES =====
  loadConformiteDocumentaires() {
    this.managementService
      .findConformitesByTache(1, 12)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.conformite_documentaires = data;
        },
        error: (error) => console.error(error),
      })
  }

  // ===== SAVE COMITE STRATEGIE =====
  saveComiteStrategie() {
    const [d1, m1, y1] = this.comiteSaveForm?.value['dateComite'].split('/');

    if (!this.selectedComite) {
      let comite: any = {
        dateComite: new Date(y1, m1 - 1, d1),
        commentaires: this.comiteSaveForm?.value['commentaires'],
        fonds: this.fonds(),
      };


      this.managementService.addComiteStrategie(comite)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('', 'Comité stratégie sauvegardé avec succès!');
            this.savedComiteStrategie = data;

            this.comiteSaveForm.reset();
            this.selectedComite = undefined;

            this.refreshEvent.emit({
              action: 'created',
              data: data,
              comite: data
            });
          },
          error: (error) => {
            console.error('Erreur lors de la sauvegarde:', error);
            this.toastr.error('Erreur lors de la sauvegarde du comité', 'Erreur');
          }
        });
    } else {
      this.updateComiteStrategie();
    }
  }

  // ===== UPDATE COMITE STRATEGIE =====
  updateComiteStrategie() {
    if (this.comiteSaveForm.invalid) {
      this.toastr.error('Veuillez remplir tous les champs requis', 'Erreur de validation');
      return;
    }

    const [d1, m1, y1] = this.comiteSaveForm?.value['dateComite'].split('/');

    let comite: any = {
      id: this.selectedComite.id,
      dateComite: new Date(y1, m1 - 1, d1),
      commentaires: this.comiteSaveForm?.value['commentaires'],
      fonds: this.fonds(),
    };


    this.managementService.updateComiteStrategie(comite)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.toastr.success('', 'Comité stratégie mis à jour avec succès');

          // Emit refresh event with updated data
          this.refreshEvent.emit({
            action: 'updated',
            data: data,
            comite: data
          });
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour:', error);
          this.toastr.error('Erreur lors de la mise à jour du comité', 'Erreur');
        }
      });
  }
}