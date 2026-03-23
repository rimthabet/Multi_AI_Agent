import { Component, DestroyRef, inject, input, output, OnInit, effect } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'funds-participation-form',
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, DecimalPipe, CurrencyPipe],
  templateUrl: './funds-participation-form.component.html',
  styleUrl: './funds-participation-form.component.scss'
})
export class FundsParticipationFormComponent implements OnInit {

  //Inputs
  prospection = input<any>();
  participation = input<any>();
  valeurAction = input<number>(0);
  primeEmission = input<number>(0);
  update = output<any>();


  // Injects
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);



  // ===== EFFECTS =====
  readonly participationEffect = effect(() => {

    const currentParticipation = this.participation();
    if (currentParticipation) {
      this._participation = currentParticipation;

      // Patch form values
      this.myForm.controls['montantOCA'].patchValue(this._participation.montantOCA);
      this.myForm.controls['montantCCA'].patchValue(this._participation.montantCCA);
      this.myForm.controls['montantActions'].patchValue(this._participation.montantActions);

      // Calculate values
      this.nbrActions = Math.trunc(
        this._participation.montantActions /
        (this.valeurAction() + this.primeEmission())
      );
      this.prime = this._participation.montantActions - this.nbrActions * this.valeurAction();

      // Fetch approved participation
      this.managementService
        .findParticipationApprouveeByFinancementAndFonds(
          this._participation.financement.id,
          this._participation.fonds.id
        )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            if (data) {
              const primeEmission = this.primeEmission();
              const valeurAction = this.valeurAction();

              data.primeEmission = primeEmission;
              data.actions = Math.trunc(data.montantActions / (valeurAction + primeEmission));

              this.participation_comite_investissement = data;
            }
          },
          error: (err) => {
            console.error('Error fetching approved participation:', err);
          }
        });

      // Fetch action subscription
      this.managementService
        .findInvSoucriptionByFinancementAndFonds(
          this._participation.financement.id,
          this._participation.fonds.id,
          'action'
        )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.inv_souscription_action_investissement = data;
          },
          error: (error) => {
            console.log(error);
          }
        });

      // Fetch OCA subscription
      this.managementService
        .findInvSoucriptionByFinancementAndFonds(
          this._participation.financement.id,
          this._participation.fonds.id,
          'oca'
        )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.inv_souscription_oca_investissement = data;
          },
          error: (error) => {
            console.log(error);
          }
        });

      // Fetch CCA subscription
      this.managementService
        .findInvSoucriptionByFinancementAndFonds(
          this._participation.financement.id,
          this._participation.fonds.id,
          'cca'
        )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.inv_souscription_cca_investissement = data;
          },
          error: (error) => {
            console.log(error);
          }
        });
    }
  });

  // Forms
  myForm: FormGroup = this.formBuilder.group({
    montantCCA: [undefined, [Validators.required]],
    montantOCA: [undefined, [Validators.required]],
    montantActions: [undefined, [Validators.required]],
  });

  // Properties
  nbrActions: number = 0;
  prime: number = 0;

  participation_comite_investissement: any | undefined;
  inv_souscription_action_investissement: any | undefined;
  inv_souscription_oca_investissement: any | undefined;
  inv_souscription_cca_investissement: any | undefined;

  _participation: any | undefined;

  //Initialize
  ngOnInit(): void {
    this.myForm.controls['montantActions'].valueChanges.subscribe((value) => {
      this.nbrActions = Math.trunc(
        value / (this.valeurAction() + this.primeEmission())
      );
      this.prime = value - this.nbrActions * this.valeurAction();
    })
  }



  // save participation
  saveParticipation() {
    let p_f: any = {
      fonds: this._participation.fonds,
      financement: this._participation.financement,
      montantCCA: this.myForm?.value['montantCCA'],
      montantOCA: this.myForm?.value['montantOCA'],
      montantActions: this.myForm?.value['montantActions'],
    };

    // Si une participation existe déjà (mode update), on ajoute son ID
    if (this._participation && this._participation.id && this._participation.id !== -1) {
      p_f.id = this._participation.id;
    }

    this.managementService
      .saveParticipationFonds(p_f)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this._participation = data;
          this.update.emit(data);
          const message = p_f.id ?
            'Participation mise à jour avec succès!' :
            'Participation sauvegardée avec succès!';
          this.toastr.success('', message);
        },
      });
  }


  // delete participation
  deleteParticipation() {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService
        .deleteParticipationFonds(this.participation().id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('', 'Participation supprimée avec succès!');
            this.update.emit(data);
            this.myForm.reset();
          },
          error: (error) =>
            this.toastr.error(
              '',
              'Échec de suppression de cette participation!'
            ),
        })
    }
  }
}
