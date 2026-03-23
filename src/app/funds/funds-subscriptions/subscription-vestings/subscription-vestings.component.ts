import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, model, output } from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClrDatagridModule, ClrModalModule } from '@clr/angular';
import { DocumentUploadComponent } from '../../../tools/document-upload/document-upload.component';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KpiBadge01Component } from "../../../widgets/kpi-badge-01/kpi-badge-01.component";
import { VestingFormComponent } from "./vesting-form/vesting-form.component";

@Component({
  selector: 'subscription-vestings',
 
  imports: [ClrDatagridModule, CdsModule, DocumentUploadComponent, DatePipe, DecimalPipe, CurrencyPipe, KpiBadge01Component, ClrModalModule, VestingFormComponent],
  templateUrl: './subscription-vestings.component.html',
  styleUrl: './subscription-vestings.component.scss'
})
export class SubscriptionVestingsComponent {

  // ===== INPUTS =====
  subscription_record = model<any>();
  prospection_conformite_documentaire = input<any[]>();
  liberation_conformite_documentaire = input<any[]>();
  loading = model<boolean>(false);
  tagged_to_update = model<boolean>(false);

  // Outputs  
  refreshEvent = output<void>();

  // ===== PROPERTIES =====

  selectedVesting: any | undefined;
  showVestingForm: boolean = false;

  // Dependencies
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);


  // ===== METHODS =====
  reloadSubscription(): void {

    this.loading.set(true);
    this.refreshEvent.emit();

    this.managementService
      .findFondsSouscriptionsList(this.subscription_record()?.souscription.fonds?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          let subscription = response.souscriptions.find((s: any) => s.souscription.id == this.subscription_record()?.souscription?.id);
          subscription.montantLibere = subscription.liberations?.reduce((a: number, b: any) => a + b?.montantLiberation, 0);
          this.subscription_record.set(subscription);
          this.tagged_to_update.set(true);
        },
        error: (error) => {
          this.toastr.error(error.error, 'Erreur');
        },
        complete: () => {
          this.loading.set(false);
        },
      });
  }

  // Delete a vesting
  deleteVesting(vestingId: number): void {

    if (confirm('Êtes-vous sûr de vouloir supprimer?')) {
      this.managementService.deleteLiberation(vestingId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.toastr.success('Libération supprimée avec succès', 'Succès');
          this.reloadSubscription();
        },
        error: (error) => {
          this.toastr.error(error.error, 'Erreur');
        }
      });
    }
  }

  // Vérifie si le document est disponible
  checkDocumentCompliance(vesting: any, lcd: any): any {
    let result = { message: '', status: '', url: '' };

    try {
      let docs = vesting?.documents.filter(
        (d: any) => lcd.documentType.id == d.type.id
      );

      if (docs.length > 0) {
        result.message = docs[0].nomFichier;
        result.status = 'success';
        result.url = docs[0].chemin.replace('/opt/fms/mpm/', '');
        return result;
      }

      if (lcd.qualification == 'OBLIGATOIRE') {
        result.message = 'Document manquant!';
        result.status = 'failure';
        return result;
      }
    } catch (error) {
      console.log(error);
    }

    result.status = 'ignore';
    return result;
  }

  // Show new vesting form
  showNewVestingForm(): void {
    this.selectedVesting = undefined;
    this.showVestingForm = true;
  }

  // Show edit vesting form
  showEditVestingForm(vesting: any): void {
    this.selectedVesting = vesting;
    this.showVestingForm = true;
  }
}
