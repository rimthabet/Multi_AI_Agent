import { Component, DestroyRef, effect, inject, input, model, OnInit, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe, formatDate } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../services/management.service';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormsModule } from '@angular/forms';
import { DocumentUploadFormComponent } from "../../../../tools/document-upload/document-upload-form/document-upload-form.component";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'vesting-form',
 
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, DocumentUploadFormComponent, DecimalPipe],
  templateUrl: './vesting-form.component.html',
  styleUrl: './vesting-form.component.scss'
})
export class VestingFormComponent implements OnInit {

  // Input
  vesting = model<any>();
  subscription_record = input<any>();
  liberation_conformite_documentaire = input<any[]>();
  loading = model<boolean>(false);

  // Output
  refreshEvent = output<any>();

  // Services
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  // Forms
  liberationSaveForm: FormGroup | undefined;

  // Effects
  readonly vestingChangeEffect = effect(() => {

    if (this.vesting()?.montantLiberation && this.vesting()?.dateLiberation) {
      this.liberationSaveForm?.patchValue({
        id: this.vesting()?.id,
        souscription: this.subscription_record()?.souscription,
        montant: this.vesting()?.montantLiberation,
        dateLiberation: formatDate(this.vesting()?.dateLiberation, 'dd/MM/yyyy', 'fr')
      })
    } else {
      this.reset();
    }
  })


  // Lifecycle Hooks
  ngOnInit(): void {

    this.liberationSaveForm = this.formBuilder.group({
      montant: [this.vesting()?.montantLibere, [Validators.required]],
      dateLiberation: [this.vesting()?.dateLiberation, Validators.required]
    });

  }

  // Methods
  saveLiberation() {

    const [d, m, y] = this.liberationSaveForm?.value["dateLiberation"].split('/');
    const liberation: any = {
      id: this.vesting()?.id,
      souscription: this.subscription_record()?.souscription,
      dateLiberation: new Date(y, m - 1, d),
      montantLiberation: this.liberationSaveForm?.value["montant"]
    }

    this.managementService.saveLiberation(liberation).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {

        this.vesting.set(data);
        this.refreshEvent.emit(data);

        this.toastr.success('', "Libération modifiée avec succès!");
      },
      complete: () => {
        this.reset();
      },
      error: (error) => {
        this.toastr.error('', "Une erreur est survenue lors de la modification de la libération!");
      }
    })
  }


  // Methods
  onChangeMontant($event: any) {

    if ($event.target.value > this.vesting()?.souscription?.montantSouscription && $event.target.value > (this.vesting()?.souscription?.montantSouscription - this.vesting()?.montantLibere))
      this.toastr.error('', "Le montant de libération doit être inférieur strictement au montant de la souscription!")
  }

  //
  reset() {
    this.liberationSaveForm?.reset();
  }

}
