import { Component, DestroyRef, effect, inject, input, output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../../services/management.service';
import { ClrNumberInputModule } from "@clr/angular";
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'shareholders-create-form',

  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, ClrNumberInputModule, CurrencyPipe],
  templateUrl: './shareholders-create-form.component.html',
  styleUrl: './shareholders-create-form.component.scss'
})
export class ShareholdersCreateFormComponent {


  /// INPUTS
  financement = input<any>();
  valeurAction = input<number>();
  apres_participation = input<boolean>();
  avant_participation = input<boolean>();
  hlf_participation = input<boolean>();
  opened = input<boolean>();

  /// OUTPUTS
  refreshEvent = output<any>();
  closed = output<any>();

  /// DEPENDENCIES
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);

  /// PROPERTIES
  actionnaireSaveForm: FormGroup = this.formBuilder.group({
    libelle: [undefined],
    nbrActionsAvAugmentation: [undefined],
    montantAvAugmentation: [undefined],
    nbrActionsApAugmentation: [undefined],
    montantApAugmentation: [undefined],
  });

  actionnaires: any[] = [];
  savedActionnaire: any | undefined;
  selectedActionnaire: any | undefined;

  montantAvant: number | undefined;
  montantApres: number | undefined;

  private validatorsInitialized = false;

  /// EFFECTS
  readonly participationTypeEffect = effect(() => {
    // Set up validators based on participation type
    if (this.apres_participation()) {
      this.actionnaireSaveForm.controls['nbrActionsApAugmentation'].addValidators(Validators.required);
      this.actionnaireSaveForm.controls['nbrActionsApAugmentation'].updateValueAndValidity();
      this.actionnaireSaveForm.controls['montantApAugmentation'].addValidators(Validators.required);
      this.actionnaireSaveForm.controls['montantApAugmentation'].updateValueAndValidity();
    } else {
      this.actionnaireSaveForm.controls['nbrActionsAvAugmentation'].addValidators(Validators.required);
      this.actionnaireSaveForm.controls['nbrActionsAvAugmentation'].updateValueAndValidity();
      this.actionnaireSaveForm.controls['montantAvAugmentation'].addValidators(Validators.required);
      this.actionnaireSaveForm.controls['montantAvAugmentation'].updateValueAndValidity();
    }

    // Set up value change subscriptions only once
    if (!this.validatorsInitialized) {
      this.actionnaireSaveForm.controls['nbrActionsAvAugmentation'].valueChanges.subscribe((value: any) =>
        this.actionnaireSaveForm.controls['montantAvAugmentation'].patchValue(
          (this.valeurAction() ?? 0) * value
        )
      );
      this.actionnaireSaveForm.controls['nbrActionsApAugmentation'].valueChanges.subscribe((value: any) =>
        this.actionnaireSaveForm.controls['montantApAugmentation'].patchValue(
          (this.valeurAction() ?? 0) * value
        )
      );
      this.validatorsInitialized = true;
    }
  });


  readonly actionnairesEffect = effect(() => {
    if (this.financement()) {
      this.refreshEvent.emit({});
    }
  });


  /// save actionnaire
  saveActionnaire() {

    let actionnaire: any = {
      offFundRaiser: this.hlf_participation(),
      libelle: this.actionnaireSaveForm?.value['libelle'],
      nbrActionsAvAugmentation: this.actionnaireSaveForm?.value['nbrActionsAvAugmentation'],
      nbrActionsApAugmentation: this.actionnaireSaveForm?.value['nbrActionsApAugmentation'],
      montantAvAugmentation: this.actionnaireSaveForm?.value['montantAvAugmentation'],
      montantApAugmentation: this.actionnaireSaveForm?.value['montantApAugmentation'],
      financement: this.financement(),
    };

    console.log("ACT BE to be added", actionnaire);

    this.managementService
      .saveActionnaire(actionnaire)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', 'Participation sauvegardée avec succès!');
          this.refreshEvent.emit({});
        },
        error: () => {
          this.toastr.error('Erreur de sauvegarde!', 'Participation non sauvegardée!');
        }
      })
  }

  /// set actionnaire
  setActionnaire(actionnaire: any) {
    this.resetForm();
    this.selectedActionnaire = actionnaire;

    this.actionnaireSaveForm.patchValue({
      libelle: actionnaire.libelle,
      nbrActionsAvAugmentation:
        actionnaire.nbrActionsAvAugmentation != null
          ? actionnaire.nbrActionsAvAugmentation
          : undefined,
      nbrActionsApAugmentation:
        actionnaire.nbrActionsApAugmentation != null
          ? actionnaire.nbrActionsApAugmentation
          : undefined,
      montantAvAugmentation:
        actionnaire.montantAvAugmentation != null
          ? actionnaire.montantAvAugmentation
          : undefined,
      montantApAugmentation:
        actionnaire.montantApAugmentation != null
          ? actionnaire.montantApAugmentation
          : undefined,
    });
  }

  /// reset form
  resetForm() {
    this.selectedActionnaire = undefined;
    this.actionnaireSaveForm?.reset();
  }

  /// hide modal
  hideModal() {
    this.closed.emit({});
    this.resetForm();
  }
}
