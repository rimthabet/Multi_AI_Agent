import { Component, DestroyRef, effect, inject, input, OnInit, output } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../services/management.service';
import { DocumentUploadComponent } from "../../../../tools/document-upload/document-upload.component";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'landmark-event-create-form',
  providers: [DatePipe],
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, DocumentUploadComponent],
  templateUrl: './landmark-event-create-form.component.html',
  styleUrl: './landmark-event-create-form.component.scss'
})
export class LandmarkEventCreateFormComponent implements OnInit {

  // ===== INPUTS =====
  projet = input<any>();
  fm = input<any>();
  refreshEvent = output<any>();
  closeModal = output<any>();

  // ===== DEPENDENCIES =====
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = inject(DatePipe);

  savedFaitMarquant: any | undefined;
  selectedFm: any | undefined;
  create: boolean = false;
  conformite_documentaires: any[] | undefined;

  // ===== FORM =====
  faitMarquantSaveForm: FormGroup = this.formBuilder.group({
    dateFM: [undefined, [Validators.required]],
    commentaires: [undefined, [Validators.required]],
  });



  // ===== INITIALIZE =====
  ngOnInit(): void {
    this.loadConformiteDocumentaires();
  }

  // ===== loadConformiteDocumentaires =====
  loadConformiteDocumentaires() {
    this.managementService
      .findConformitesByTache(5, 5)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.conformite_documentaires = data;
        },
      })
  }

  // ===== EFFECTS =====
  readonly fmEffect = effect(() => {
    if (this.fm()) {
      this.setFm(this.fm());
    }
  });



  // ===== saveFaitMarquant =====
  saveFaitMarquant() {
    const [d, m, y] = this.faitMarquantSaveForm?.value['dateFM'].split('/');

    if (!this.selectedFm) {
      let fm: any = {
        dateFM: new Date(y, m - 1, d),
        commentaires: this.faitMarquantSaveForm?.value['commentaires'],
        projet: this.projet(),
      };
      this.managementService.addFaitMarquant(fm).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.toastr.success('', 'Fait marquant sauvegardé avec succès!');
          this.create = true;
          this.resetForm();
          this.refreshEvent.emit(fm);
          this.closeModal.emit(true);
        },
      })
    } else {
      this.updateFaitMarquant();
    }
  }

  // ===== updateFaitMarquant =====
  updateFaitMarquant() {
    const [d, m, y] = this.faitMarquantSaveForm?.value['dateFM'].split('/');
    let fm: any = {
      id: this.selectedFm.id,
      dateFM: new Date(y, m - 1, d),
      commentaires: this.faitMarquantSaveForm?.value['commentaires'],
      projet: this.projet(),
    };

    this.managementService.updateFaitMarquant(fm).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.refreshEvent.emit(fm);
        this.toastr.success('Fait marquant sauvegardé avec succès');
        this.closeModal.emit(true);
      },
    })

  }

  // ===== setFm =====
  setFm(fm: any) {
    if (fm) {
      this.resetForm();
      this.selectedFm = fm;
      this.faitMarquantSaveForm.patchValue({
        dateFM: fm?.dateFM
        ? this.datePipe.transform(new Date(fm.dateFM), 'dd/MM/yyyy')
        : '',
        commentaires: fm.commentaires,
      });
    }
  }

  // ===== resetForm =====
  resetForm() {
    this.selectedFm = undefined;
    this.faitMarquantSaveForm?.reset();
  }


}