import { Component, DestroyRef, effect, inject, input, OnInit, output } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../../services/management.service';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'oca-convertion-create-form',
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, CurrencyPipe, DecimalPipe],
  providers: [DatePipe],
  templateUrl: './oca-convertion-create-form.component.html',
  styleUrl: './oca-convertion-create-form.component.scss'
})
export class OcaConvertionCreateFormComponent implements OnInit {

  // ===== INPUT =====
  souscription = input<any>();
  fonds = input<any>();
  financement = input<any>();
  conversion = input<any>();


  // ===== OUTPUT =====
  refreshEvent = output<any>();


  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly datePipe = inject(DatePipe);

  // ===== FORM =====
  conversionSaveForm!: FormGroup;

  // ===== INITIALIZATION =====
  ngOnInit(): void {

    // ===== CONVERSION FORM =====
    this.conversionSaveForm = this.formBuilder.group({
      dateDeConversion: [undefined, [Validators.required]],
      montant: [undefined, [Validators.required]],
      nbrActions: [undefined, [Validators.required]],
    });

  }


  // ===== EFFECTS CONVERSION =====  
  readonly conversionEffect = effect(() => {
    if (this.conversion()) {
      this.initFormConversion();
    }
  });


  // ===== SAVE CONVERSION =====
  saveConversion() {
    const [d1, m1, y1] = this.conversionSaveForm?.value['dateDeConversion'].split('/');
    let conversion = {
      financement: { id: this.financement()?.id },
      fonds: { id: this.fonds()?.id },
      dateAge: new Date(
        y1, m1 - 1, d1
      ),
      montant: this.souscription()?.montant,
      nbrActions: this.conversionSaveForm?.value['nbrActions'],
    };


    this.managementService.saveConversion(conversion, 'oca')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.toastr.success('Conversion en OCA sauvegardée avec succès!');
          this.conversion = data;
          this.conversionSaveForm.reset();
          this.refreshEvent.emit(data);
        },
      })

  }


  initFormConversion(data?: any) {
    if (!data) {
      data = this.conversion();
    } else {
      this.conversion = data;
    }
    this.conversionSaveForm?.patchValue({
      dateDeConversion: this.conversion()?.dateAge
        ? this.datePipe.transform(new Date(this.conversion()?.dateAge), 'dd/MM/yyyy')
        : '',
      montant: this.conversion()?.montant,
      nbrActions: this.conversion()?.nbrActions,
    });
  }



  // ===== DELETE CONVERSION =====
  deleteConversion() {
    if (confirm('Veuillez confirmer cette suppression !')) {

      this.managementService
        .deleteConversion(this.conversion()?.id, 'oca')
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
        })

    }
  }



}
