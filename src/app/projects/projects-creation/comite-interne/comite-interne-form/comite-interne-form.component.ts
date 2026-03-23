import { Component, DestroyRef, inject, input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ManagementService } from '../../../../services/management.service';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'comite-interne-form',
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, DatePipe],
  templateUrl: './comite-interne-form.component.html',
  styleUrl: './comite-interne-form.component.scss'
})
export class ComiteInterneFormComponent implements OnInit, OnChanges {
  //Inputs
  prospection = input<any>();
  financement = input<any>();

  // Injects
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);

  //PROPERTIES
  status: number | undefined;
  lastComiteRecord: any | undefined;
  _financement: any | undefined;
  comites: any[] = [];
  openModal: boolean = false;
  modalHidden: boolean = false;

  selectedComite: any | undefined;

  comiteSaveForm: FormGroup = this.formBuilder.group({
    financement: [undefined, [Validators.required]],
    dateComite: [
      undefined,
      [Validators.required],
    ],
    nextDateComite: [undefined],
    decision: [undefined, [Validators.required]],
    points: [undefined],
  });

  // INITIALIZE
  ngOnInit(): void {
    this._financement = this.financement();
    this.comiteSaveForm.controls['decision'].valueChanges.subscribe(
      (value: any) => {
        this.modalHidden = value == '2';
        this.status = value;

        if (value == 2) {
          this.comiteSaveForm.controls['nextDateComite'].addValidators([
            Validators.required,
          ]);
          this.comiteSaveForm.controls[
            'nextDateComite'
          ].updateValueAndValidity();
          this.comiteSaveForm.controls['points'].addValidators([
            Validators.required,
          ]);
          this.comiteSaveForm.controls['points'].updateValueAndValidity();
        } else {
          this.comiteSaveForm.controls['nextDateComite'].clearValidators();
          this.comiteSaveForm.controls[
            'nextDateComite'
          ].updateValueAndValidity();
          this.comiteSaveForm.controls['points'].clearValidators();
          this.comiteSaveForm.controls['points'].updateValueAndValidity();
        }
      }
    )


    if (this._financement) this.setFinancement(this._financement);
  }


  // ngOnChanges
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['financement'] && changes['financement'].currentValue) {
      const financement = changes['financement'].currentValue;
      if (financement) {
        this.setFinancement(financement);
      }
    }
  }

  // Set financement
  setFinancement(data: any) {
    this._financement = data;
    this.comiteSaveForm.controls['financement'].patchValue(this._financement);
    this.loadComitieInternes();
  }


  // Ajouter comite
  ajouterComiteInterne() {
    this.openModal = true;
  }


  // Load comitie internes
  loadComitieInternes() {
    this.managementService
      .fetchComiteInternes(this._financement?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.comites = data;
          this.lastComiteRecord = data[0];
        },
        error: (error: any) => {
          console.error(error);
        }
      })
  }

  // Hide modal
  hideModalComite() {
    this.openModal = false;
    this.comiteSaveForm.reset();
  }


  // Save comite
  saveComiteInterne() {
    const dateComite = this.comiteSaveForm.value['dateComite'];
    const nextDateComite = this.comiteSaveForm.value['nextDateComite'];

    if (!dateComite) {
      this.toastr.error('', 'Veuillez saisir la date du comité !');
      return;
    }

    const [d1, m1, y1] = dateComite.split('/');

    let d2, m2, y2;
    if (nextDateComite) {
      [d2, m2, y2] = nextDateComite.split('/');
    }

    let decision_object: any = {
      dateComite: new Date(+y1, +m1 - 1, +d1),
      financement: this._financement,
      decision: this.comiteSaveForm.controls['decision'].value,
      points: this.comiteSaveForm.controls['points'].value,
    };

    if (nextDateComite) {
      decision_object.nextDateComite = new Date(+y2, +m2 - 1, +d2);
    }

    this.managementService
      .comiteInterneDesicion(decision_object)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          if (data != null) {
            this.toastr.success('', 'Comité interne bien sauvegardé !');
            this.comiteSaveForm.reset();
            this.loadComitieInternes();
            this.openModal = false;
            this.modalHidden = false;
          } else {
            this.toastr.error(
              '',
              'Erreur de sauvegarde, veuillez contacter plateforme admin!'
            );
          }
        },
        error: (error: any) => {
          console.error(error);
        },
      });
  }

  // Hide modal
  hideModal() {
    this.modalHidden = false;
    if (
      this.comiteSaveForm.controls['nextDateComite'].invalid ||
      this.comiteSaveForm.controls['points'].invalid
    )
      this.comiteSaveForm.controls['decision'].setValue(undefined);
  }


  // Delete comite
  supprimerComiteInterne() {
    if (confirm('Êtes-vous sûr de vouloir supprimer?')) {
      this.managementService
        .deleteComiteInterne(this.selectedComite.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('', 'Comité interne supprimé avec succès!');
            this.loadComitieInternes();
            this.modalHidden = false;
            this.comiteSaveForm.reset();
            this.comiteSaveForm.controls['financement'].setValue(
              this.financement
            );
          },
          error: (error: any) => {
            console.error(error);
          }
        })
    }
  }


  // Cancel selection
  cancelSelection(): void {
    this.comiteSaveForm.reset();
    this.selectedComite = undefined;
  }



}
