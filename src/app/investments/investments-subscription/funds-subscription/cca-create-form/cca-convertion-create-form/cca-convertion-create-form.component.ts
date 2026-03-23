import { Component, DestroyRef, effect, inject, input, model, OnInit, output } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CurrencyPipe, formatDate } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'cca-convertion-create-form',
  imports: [ClarityModule, CdsModule, ReactiveFormsModule, FormsModule, CurrencyPipe],
  providers: [DatePipe],
  templateUrl: './cca-convertion-create-form.component.html',
  styleUrl: './cca-convertion-create-form.component.scss'
})
export class CcaConvertionCreateFormComponent {

  // ===== INPUT =====
  souscription = input<any>();
  fonds = input<any>();
  financement = input<any>();
  conversion = model<any>();
  loading = model<boolean>(false);

  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly datePipe = inject(DatePipe);

  // ===== FORM =====
  conversionSaveForm = this.formBuilder.group({
    id: [null],
    dateDeConversion: [formatDate(new Date(), 'dd/MM/yyyy', 'fr'), [Validators.required]],
    montant: [undefined, [Validators.required]],
    nbrActions: [undefined, [Validators.required]],
    montantInteretRembourse: [undefined, [Validators.required]],
  });

  // ===== EFFECT CONVERSION =====
  readonly conversionEffect = effect(() => {
    if (this.conversion()) {
      this.initFormConversion();
    }
  });

  readonly souscriptionEffect = effect(() => {
    if (this.souscription()) {
      this.conversionSaveForm.patchValue({ montant: this.souscription().montant });
    }
  });


  initFormConversion(data?: any) {
    if (!data) {
      data = this.conversion();
    } else {
      this.conversion = data;
    }
    this.conversionSaveForm.patchValue({
      id: data.id ?? null,
      dateDeConversion: data?.dateAge
        ? this.datePipe.transform(new Date(data.dateAge), 'dd/MM/yyyy')
        : undefined,
      montant: data.montant,
      nbrActions: data.nbrActions,
      montantInteretRembourse: data.montantInteretRembourse,
    });
  }


  // ===== SAVE CONVERSION =====
  saveConversion() {
    const [d1, m1, y1] = this.conversionSaveForm?.value['dateDeConversion']!.split('/');
    let conversion = {
      financement: { id: this.financement().id },
      fonds: { id: this.fonds().id },
      dateAge: new Date(
        +y1, +m1 - 1, +d1
      ),
      montant: this.souscription().montant,
      nbrActions: this.conversionSaveForm?.value['nbrActions'],
      montantInteretRembourse:
        this.conversionSaveForm?.value['montantInteretRembourse'],
    };


    this.managementService.saveConversion(conversion, 'cca')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.toastr.success('Conversion en OCA sauvegardée avec succès!');
          this.conversion.set(data);
          this.conversionSaveForm.reset();
        },
        error: (error) => { },
        complete: () => {
          this.loading.set(false);
        }
      })

  }

  // ===== DELETE CONVERSION =====
  deleteConversion() {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService
        .deleteConversion(this.conversion()?.id, 'cca')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('', 'Conversion supprimée avec succès!');
          },
          error: (error) =>
            this.toastr.error(
              '',
              'Échec de suppression de cette conversion!'
            ),
          complete: () => {
            this.loading.set(false);
            this.conversion.set(undefined);
          }
        })
    }
  }

}
