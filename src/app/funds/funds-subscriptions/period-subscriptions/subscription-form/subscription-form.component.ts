import { DatePipe, DecimalPipe, formatDate } from '@angular/common';
import {
  Component,
  DestroyRef,
  inject,
  input,
  output,
  OnInit,
  effect,
  model

} from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ManagementService } from '../../../../services/management.service';
import { ToastrService } from 'ngx-toastr';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { DocumentUploadComponent } from "../../../../tools/document-upload/document-upload.component";
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
@Component({
  selector: 'subscription-form',
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, DecimalPipe, DatePipe, DocumentUploadComponent],
  templateUrl: './subscription-form.component.html',
  styleUrl: './subscription-form.component.scss'
})
export class SubscriptionFormComponent implements OnInit {

  // Input
  fonds = input<any>();
  subscription_record = model<any>();
  loading = model<boolean>(false);

  prospection_conformite_documentaire = input<any[]>();
  subscription_periode = input<any>();
  subscribers = input<any[]>();

  // Output
  refreshEvent = output<void>();

  // Services
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  // Local variables
  subscriptionSaveForm: FormGroup | undefined;

  // Effect 
  subscriptionEffect = effect(() => {

    if (this.subscription_record()?.souscription) {
      this.subscriptionSaveForm?.patchValue({
        souscripteur: this.subscription_record()?.souscription?.souscripteur,
        date_souscription: formatDate(this.subscription_record()?.souscription?.dateSouscription, 'dd/MM/yyyy', 'fr-FR'),
        montant: this.subscription_record()?.souscription?.montantSouscription,
      });
    } else {
      this.subscriptionSaveForm?.reset();
    }

  });

  //  Form initialization
  ngOnInit(): void {

    this.subscriptionSaveForm = this.formBuilder.group({
      souscripteur: [null, Validators.required],
      date_souscription: [null, Validators.required],
      montant: [null, Validators.required],
    });
  }

  // Saving or updating the subscription
  saveSubscription() {

    const [d, m, y] = this.subscriptionSaveForm?.value['date_souscription'].split('/');
    let souscription = {
      id: this.subscription_record()?.souscription?.id ?? null,
      montantSouscription: this.subscriptionSaveForm?.value['montant'],
      dateSouscription: new Date(y, m - 1, d),
      souscripteur: this.subscriptionSaveForm?.value['souscripteur'],
      fonds: this.fonds(),
    };

    // Saving or updating the subscription
    this.managementService
      .saveSouscription(souscription)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          if (this.subscription_record()?.souscription?.id == null)
            this.toastr.success('', 'Souscription Ajoutée avec Succès!');
          else
            this.toastr.success('', 'Souscription Modifiée avec Succès!');

          this.refreshEvent.emit();
          this.loading.set(false);
        },
        error: (error: any) => {
          this.toastr.error('', 'Souscription non ajoutée!');
        }
      })
  }


  equals(a: any, b: any) {
    return a?.id === b?.id;
  }

}
