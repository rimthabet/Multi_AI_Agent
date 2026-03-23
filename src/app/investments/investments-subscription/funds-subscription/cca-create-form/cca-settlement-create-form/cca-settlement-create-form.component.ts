import { Component, DestroyRef, effect, inject, input, OnInit, output, model } from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ReactiveFormsModule, FormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'cca-settlement-create-form',

  imports: [CdsModule, ClarityModule, ReactiveFormsModule, FormsModule, CurrencyPipe],
  providers: [DatePipe],
  templateUrl: './cca-settlement-create-form.component.html',
  styleUrl: './cca-settlement-create-form.component.scss'
})
export class CcaSettlementCreateFormComponent {

  // ===== INPUT =====
  souscription = input<any>();
  fonds = input<any>();
  financement = input<any>();
  reglement = model<any>();
  loading = model<boolean>(false);

  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly datePipe = inject(DatePipe);

  reglementSaveForm: FormGroup = this.formBuilder.group({
    datePV: [undefined, [Validators.required]],
    montantPaye: [undefined, [Validators.required]],
    interet: [undefined, [Validators.required]],
  });

  // ===== EFFECT REGLEMENT =====
  readonly reglementEffect = effect(() => {
    if (this.reglement()) {
      this.reglementSaveForm.patchValue({ montantPaye: this.reglement()?.montantPaye });
    }
  });


  readonly souscriptionEffect = effect(() => {
    if (this.souscription()) {

      console.log("Souscription", this.souscription());

      this.initFormReglement(this.souscription());
    }
  });


  // ===== INIT FORM REGLEMENT =====
  initFormReglement(data?: any) {
    this.reglementSaveForm.patchValue({
      id: data?.id ?? null,
      datePV: this.datePipe.transform(new Date(), 'dd/MM/yyyy'),
      montantPaye: this.souscription()?.montant,
      interet: 0,
    });
  }

  // ===== SAVE REGLEMENT =====
  saveReglement() {

    const [d1, m1, y1] = this.reglementSaveForm?.value['datePV'].split('/');
    let reglement = {
      financement: { id: this.financement()?.id },
      fonds: { id: this.fonds()?.id },
      datePV: new Date(
        y1, m1 - 1, d1
      ),
      montantPaye: this.souscription()?.montant,
      interet: this.reglementSaveForm?.value['interet'],
    };

    this.managementService.saveReglementCCA(reglement)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.toastr.success('Règlement en CCA sauvegardée avec succès!');
          this.reglement.set(data);
          this.reglementSaveForm.reset();
        },
        error: (error) => { console.log(error) },
        complete: () => {
          this.loading.set(false);
        }
      })
  }

  deleteReglement() {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService.deleteReglement(this.reglement().id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('', 'Règlement supprimée avec succès!');
          },
          error: (error) =>
            this.toastr.error('', 'Échec de suppression de ce règlement!'),
          complete: () => {
            this.loading.set(false);
            this.reglement.set(undefined);
          }
        })

    }
  }
}
