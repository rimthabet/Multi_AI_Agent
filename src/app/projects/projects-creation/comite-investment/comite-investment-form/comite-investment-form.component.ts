import { Component, input, inject, OnInit, effect } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ManagementService } from '../../../../services/management.service';
import { DestroyRef } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'comite-investment-form',
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, DatePipe, DecimalPipe],
  templateUrl: './comite-investment-form.component.html',
  styleUrl: './comite-investment-form.component.scss'
})
export class ComiteInvestmentFormComponent implements OnInit {

  //Inputs
  prospection = input<any>();
  fonds = input<any>();
  financement = input<any>();
  participation = input<any>();

  //Injects
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);

  //properties
  showApprofondirModal: boolean = false;
  showReserveModal: boolean = false;
  loading: boolean = false;
  openModal: boolean = false;
  modifState: boolean = false;

  comites: any[] = [];
  participations: any[] = [];

  selectedComite: any | undefined;
  _participation: any | undefined;
  status: number | undefined;
  lastComiteRecord: any | undefined;
  totalMontant: number = 0;

  comiteForm: FormGroup = this.formBuilder.group({
    dateComite: [undefined, [Validators.required]],
    decision: [null, [Validators.required]],
  });

  approfondirForm: FormGroup = this.formBuilder.group({
    nextDateComite: [undefined],
    points: [null],
  });

  reserveForm: FormGroup = this.formBuilder.group({
    montantCCA: [null],
    montantOCA: [null],
    montantActions: [null],
    reserve: [null],
  });

  // Effect
  participationEffect = effect(() => {
    const currentParticipation = this.participation();
    if (currentParticipation) {
      this._participation = { ...currentParticipation };
      this.updateReserveFormWithParticipation();
    }
  });

  // On init
  ngOnInit(): void {
    this.comiteForm.patchValue({
      financement: this.financement(),
      fonds: this.fonds(),
    });

    this.comiteForm.get('decision')?.valueChanges.subscribe((value: any) => {
      this.status = Number(value);

      this.showApprofondirModal = value === '2';
      this.showReserveModal = value === '0';

      // Si c'est "Accepter" (0) 
      if (value === '0') {
        this.updateReserveFormWithParticipation();
      }

      // Approfondir modal
      if (value === '2') {
        this.approfondirForm.get('nextDateComite')?.setValidators([Validators.required]);
        this.approfondirForm.get('points')?.setValidators([Validators.required]);
      } else {
        this.approfondirForm.get('nextDateComite')?.clearValidators();
        this.approfondirForm.get('points')?.clearValidators();
      }

      this.approfondirForm.get('nextDateComite')?.updateValueAndValidity();
      this.approfondirForm.get('points')?.updateValueAndValidity();

      // Reserve modal
      if (value === '3') {
        this.reserveForm.get('reserve')?.setValidators([Validators.required]);
      } else {
        this.reserveForm.get('reserve')?.clearValidators();
      }

      this.reserveForm.get('reserve')?.updateValueAndValidity();
    });

    // Calculate total
    this.reserveForm.valueChanges.subscribe(() => {
      this.calculateTotal();
    });

    this.loadComitieInvestissements();
  }


  // Update reserve form with participation
  updateReserveFormWithParticipation() {
    const currentParticipation = this.participation() || this._participation;
    if (currentParticipation) {
      const montantCCA = currentParticipation.montantCCA || 0;
      const montantOCA = currentParticipation.montantOCA || 0;
      const montantActions = currentParticipation.montantActions || 0;

      this.reserveForm.patchValue({
        montantCCA: montantCCA,
        montantOCA: montantOCA,
        montantActions: montantActions,
      });

      this.totalMontant = montantCCA + montantOCA + montantActions;

      this.reserveForm.markAsTouched();
      this.reserveForm.updateValueAndValidity();
    }
  }

  // Add CI
  addComiteInvestissement() {
    this.openModal = true;
  }

  // Hide modal
  hideModalComite() {
    this.openModal = false;
    this.comiteForm.reset();
  }

  // Set participation 
  setParticipation(data: any) {
    this._participation = { ...data };
    this.updateReserveFormWithParticipation();
  }

  // Set financement
  setFinancement(data: any) {
    this.financement = data;
    this.comiteForm.controls['financement'].patchValue(this.financement);
    this.loadComitieInvestissements();
  }

  // Load CI
  loadComitieInvestissements() {
    this.managementService
      .fetchComiteInvestissements(this.financement()?.id, this.fonds()?.id)
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

  // Save CI
  saveComiteInvestissement() {
    const dateComite = this.comiteForm?.value['dateComite'];
    const nextDateComite = this.approfondirForm?.value['nextDateComite'];
    const decision = this.comiteForm.controls['decision'].value;

    const [d1, m1, y1] = dateComite.split('/');

    let nextDateComiteObj = null;
    if (nextDateComite) {
      const [d2, m2, y2] = nextDateComite.split('/');
      nextDateComiteObj = new Date(y2, m2 - 1, d2);
    }

    let decision_object = {
      dateComite: new Date(y1, m1 - 1, d1),
      financement: this.financement(),
      fonds: this.fonds(),
      decision: decision,
      points: this.approfondirForm.controls['points'].value,
      reserve: this.reserveForm.controls['reserve'].value,
      nextDateComite: nextDateComiteObj
    };

    let participation = {
      montantCCA: this.reserveForm.controls['montantCCA'].value,
      montantOCA: this.reserveForm.controls['montantOCA'].value,
      montantActions: this.reserveForm.controls['montantActions'].value,
    };

    let record = { ci: decision_object, pfa: participation };
    console.log("record", record);

    this.managementService
      .comiteInvestissementDesicion(record)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.toastr.success('', 'Comité interne bien sauvegardé !');
          console.log("data server", data);
          this.selectedComite = null;
          this.loadComitieInvestissements();
          this.hideApprofondirModal();
          this.hideReserveModal();
          this.hideModalComite();
        },
        error: (error: any) => {
          console.error(error);
        }
      })
  }
  // Delete CI
  supprimerComiteInvestissement() {
    if (confirm('Êtes-vous sûr de vouloir supprimer?')) {
      this.managementService
        .deleteComiteInvestissement(this.selectedComite.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success(
              '',
              "Comité d'investissement supprimé avec succès!"
            );
            this.loadComitieInvestissements();
            this.comiteForm.reset();
            this.approfondirForm.reset();
            this.reserveForm.reset();
          },
          error: (error: any) => {
            console.error(error);
          }
        })
    }
  }

  // Set CI for modification
  setCIforModif() {
    this.modifState = true;
    const [d1, m1, y1] = this.selectedComite?.dateComite.split('/');
    const [d2, m2, y2] = this.selectedComite?.nextDateComite.split('/');

    let data = { ...this.selectedComite };

    this.comiteForm.patchValue({
      financement: data.financement,
      fonds: data.fonds,
      dateComite: new Date(y1, m1 - 1, d1),
      nextDateComite: new Date(y2, m2 - 1, d2),
      decision: data.decision,
      points: data.points,
      montantCCA: data.montantCCA,
      montantOCA: data.montantOCA,
      montantActions: data.montantActions,
      reserve: data.reserve,
    });
  }

  // Cancel selection
  cancelSelection(): void {
    this.comiteForm.reset();
    this.selectedComite = undefined;
    this.modifState = false;

    // Réinitialiser avec les valeurs originales de participation
    this.updateReserveFormWithParticipation();
  }

  // Hide approfondir modal
  hideApprofondirModal() {
    this.showApprofondirModal = false;
    if (!this.selectedComite)
      this.comiteForm.controls['decision'].setValue(undefined);
  }

  // Hide modal
  hideReserveModal() {
    this.showReserveModal = false;
    if (!this.selectedComite)
      this.comiteForm.controls['decision'].setValue(undefined);
  }

  // Calcul du total
  calculateTotal() {
    const montantCCA = Number(this.reserveForm.get('montantCCA')?.value) || 0;
    const montantOCA = Number(this.reserveForm.get('montantOCA')?.value) || 0;
    const montantActions = Number(this.reserveForm.get('montantActions')?.value) || 0;

    this.totalMontant = montantCCA + montantOCA + montantActions;
  }


}
