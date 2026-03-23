import { Component, DestroyRef, input, OnInit } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FinancingSwitchComponent } from "../../../../tools/financing-switch/financing-switch.component";
import { FormGroup } from '@angular/forms';
import { FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { inject } from '@angular/core';
import { ManagementService } from '../../../../services/management.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';


@Component({
  selector: 'valuation-shares',
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, DecimalPipe, FinancingSwitchComponent, CurrencyPipe],
  templateUrl: './valuation-shares.component.html',
  styleUrl: './valuation-shares.component.scss'
})
export class ValuationSharesComponent implements OnInit {
  // Input
  prospection = input<any>();

  // Injects
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);

  // Forms Valorisation
  valorisationForm: FormGroup = this.formBuilder.group({
    val_action_av: [0, [Validators.required]],
    val_action_ap: [0, [Validators.required]],
    nominal_ap: [0, [Validators.required]],
    prime_emission_ap: [0, [Validators.required]],
  });

  // Forms PEMA Calculator
  pemaCalculatorForm: FormGroup = this.formBuilder.group({
    prime_emission_ap_globale: [undefined, [Validators.required]],
  });

  // Used for visual formatting
  val_action_av: number | undefined;
  val_action_ap: number | undefined;
  nominal_ap: number | undefined;
  prime_emission_ap: number | undefined;
  prime_emission_ap_globale: number | undefined;
  prime_emission_calculator_opened: boolean = false;

  // Used for persistency checking
  valorisation: any | undefined;
  selectedFinancement: any | undefined;

  /// INITIALIZE
  ngOnInit(): void {
    this.valorisationForm
      .get('val_action_av')
      ?.valueChanges.subscribe((value: number) => (this.val_action_av = value));
    this.valorisationForm
      .get('val_action_ap')
      ?.valueChanges.subscribe((value: number) => (this.val_action_ap = value));
    this.valorisationForm
      .get('nominal_ap')
      ?.valueChanges.subscribe((value: number) => {
        this.valorisationForm.patchValue({
          val_action_ap:
            value + this.valorisationForm.controls['prime_emission_ap'].value,
        });
        this.nominal_ap = value;
      });
    this.valorisationForm
      .get('prime_emission_ap')
      ?.valueChanges.subscribe((value: number) => {
        this.valorisationForm.patchValue({
          val_action_ap:
            value + this.valorisationForm.controls['nominal_ap'].value,
        });
        this.prime_emission_ap = value;
      });

    this.pemaCalculatorForm
      .get('prime_emission_ap_globale')
      ?.valueChanges.subscribe((value: number) => {
        this.prime_emission_ap_globale = value;
        this.calculatePemA();
      });
  }



  /// init form
  initForm() {
    this.valorisationForm.patchValue({
      val_action_av: this.valorisation?.valeurActionAvPart,
      val_action_ap: this.valorisation?.valeurActionApPart,
      nominal_ap: this.valorisation?.nominalApPart,
      prime_emission_ap: this.valorisation?.primeEmissionApPart,
    });
  }

  /// save valorisation action
  saveValorisationAction() {
    if (this.selectedFinancement) {
      let valorsiationAction: any = {
        id: this.valorisation ? this.valorisation.id : null,
        financement: this.selectedFinancement,
        nominalAvPart: 0,
        nominalApPart: this.valorisationForm.controls['nominal_ap'].value,
        valeurActionAvPart:
          this.valorisationForm.controls['val_action_av'].value,
        valeurActionApPart:
          this.valorisationForm.controls['val_action_ap'].value,
        primeEmissionAvPart: 0,
        primeEmissionApPart:
          this.valorisationForm.controls['prime_emission_ap'].value,
      };

      this.managementService
        .saveValorisationAction(valorsiationAction)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.valorisation = data;
            this.toastr.success('Valorisation sauvegardée avec succès!');
          },
          error: (error) =>
            this.toastr.error('Echec de sauvegarde de la valorisation!'),
        })
    }
  }

  /// delete valorisation
  deleteValorisation() {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService
        .deleteValorisationAction(this.valorisation?.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('', 'Valorisation supprimée avec succès!');
            this.valorisation = undefined;
            this.valorisationForm.reset();
          },
          error: (error) =>
            this.toastr.error(
              '',
              'Échec de suppression de cette valorisation!'
            ),
        })
    }
  }

  /// financement changed
  financementChanged($event: any) {
    this.selectedFinancement = $event;
    this.managementService
      .findValorisationAction(this.selectedFinancement?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.valorisation = data;
          this.initForm();
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Valorisation non chargée!');
        }
      })
  }

  /// calculate pem a
  calculatePemA() {
    if (this.valorisationForm.controls['nominal_ap'].value) {
      let nb_actions =
        (this.selectedFinancement.financementActions -
          this.prime_emission_ap_globale!) /
        this.valorisationForm.controls['nominal_ap'].value;
      this.prime_emission_ap = this.prime_emission_ap_globale! / nb_actions;
    }
  }

  /// set pem a
  setPemA() {
    this.valorisationForm.patchValue({
      prime_emission_ap: this.prime_emission_ap?.toFixed(2),
    });

    this.prime_emission_calculator_opened = false;
  }


}
