import { formatDate } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, model, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule } from "@cds/angular";
import { ClrModalModule, ClrTextareaModule, ClrDatepickerModule } from "@clr/angular";
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EmailingFormComponent } from "../../../../widgets/emailing-form/emailing-form.component";
import { FinancingPlansAcceptanceComponent } from "./financing-plans-acceptance/financing-plans-acceptance.component";

interface Refusal {
  projet: any;
  motifRejet: string;
  dateRefus: string;
  dateEnvoiLettre: string;
}


@Component({
  selector: 'decision-form',
  imports: [CdsButtonModule, CdsIconModule, CdsDividerModule,
    ClrModalModule, ClrTextareaModule, ClrDatepickerModule, ReactiveFormsModule, FormsModule, EmailingFormComponent, FinancingPlansAcceptanceComponent],
  templateUrl: './decision-form.component.html',
  styleUrl: './decision-form.component.scss'
})
export class DecisionFormComponent {

  prospection = model<any>();
  loading = model<boolean>(false);
  refusalData = signal<Refusal | null>(null);


  readonly destroyRef = inject(DestroyRef);
  readonly formBuilder = inject(FormBuilder);
  readonly toastr = inject(ToastrService);
  readonly managementService = inject(ManagementService);

  // In case the project is refused, we retriev the rejection reasons
  lastRefusal = computed(() => this.loadRefusalData());
  refusalDataEffect = effect(() => {
    if (this.prospection()?.statut === 3) {
      this.loadRefusalData();
    }
  });

  // Load refusal data
  loadRefusalData() {
    this.loading.set(true);
    this.managementService.findRefusMotifs(this.prospection()?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.refusalData.set((data && data.length > 0) ? data[0] : null);
        },
        error: (error) => {
          console.error('Erreur lors du chargement des refus :', error);
          this.toastr.error('Erreur lors du chargement des motifs de refus');
        },
        complete: () => {
          this.loading.set(false);
        }
      });
  }

  emailModalOpened: boolean = false;
  acceptanceModalOpened: boolean = false;
  refusalModalOpened: boolean = false;

  refuseSaveForm: FormGroup = this.formBuilder.group({
    motif: [undefined, [Validators.required]],
    date: [formatDate(new Date(), "dd?MM/yyyy", "fr"), Validators.required],
  });
  textFormHTML: any;


  // save refus
  saveRefus() {

    this.loading.set(true);
    const refus: any = {
      projet: { id: this.prospection().id },
      motifRejet: this.refuseSaveForm?.value['motif'],
      dateRefus: this.refuseSaveForm.value['date'],
      dateEnvoiLettre: this.refuseSaveForm.value['date'],
    };
    this.managementService.saveRefus(refus)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (refus: any) => {
          const prospection = { ...this.prospection() };
          prospection.statut = 3;
          prospection.statutActuel = "REFUSE";
          this.prospection.set(prospection);
          this.toastr.success('', 'Projet refusé avec succès!');
        },
        error: (error) => {
          console.error('Erreur lors de la sauvegarde du refus :', error);
          this.toastr.error(error?.error.error, '', { timeOut: 15000, enableHtml: true });
        },
        complete: () => {
          console.log('Sauvegarde du refus terminée');
          this.refusalModalOpened = false;
          this.loading.set(false);
        },
      })
  }

  ///// save approval
  saveApproval() {
    this.loading.set(true);
    this.managementService
      .UpdatedStatutPreselection(this.prospection()?.id, 2).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          console.log("Prospection", data);
          this.prospection.set(data);
          this.toastr.success('', 'Projet approuvé avec succès!');
        },
        error: (error) => {
          this.toastr.error('', error?.error.error);
        },
        complete: () => {
          console.log('Mise à jour du statut terminée');
          this.acceptanceModalOpened = false;
          this.loading.set(false);
        },
      })
  }


  //// reset the decision
  resetTheDecision() {
    this.loading.set(true);

    if (confirm('Voulez-vous vraiment annuler la décision de présélection ?')) {
      this.managementService
        .UpdatedStatutPreselection(this.prospection()?.id, 0).pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.prospection.set(data);
            this.toastr.success('', 'Décision annulée avec succès!');
          },
          error: (error) => {
            this.toastr.error('', error?.error.error);
          },
          complete: () => {
            this.loading.set(false);
          },
        })
    }
  }

}
