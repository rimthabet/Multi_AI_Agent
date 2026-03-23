import { Component, DestroyRef, ElementRef, inject, OnInit, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { MultiPurposeDeleteDialogComponent } from '../../tools/multi-purpose-delete-dialog/multi-purpose-delete-dialog.component';
import { environment } from '../../../environment/environment';
import { ManagementService } from '../../services/management.service';

@Component({
  selector: 'funds-auditor',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    MultiPurposeDeleteDialogComponent,
  ],
  templateUrl: './funds-auditor.component.html',
  styleUrl: './funds-auditor.component.scss'
})
export class FundsAuditorComponent implements OnInit{

   //  Injects and ViewChild
   mp_delete_popup = viewChild.required<ElementRef>("mp_delete_popup");
   rest_url: string = environment.apiUrl + '/cac';
 
   private readonly destroyRef = inject(DestroyRef);
   private readonly fb = inject(FormBuilder).nonNullable;
   private readonly toastr = inject(ToastrService);
   private readonly managementService = inject(ManagementService);
 
   public auditorForm!: FormGroup;
 
   loading: boolean = false;
   auditors: any[] = [];
   selectedItem: any = null;
   openModal: boolean = false;
   delete_message: string =
    "Cette opération de suppression est considérée très dangereuse. Elle \
            va induire la suppression de tous les fonds d'investissement ayant cette banque dépositaire.";
 
   ngOnInit(): void {
     this.auditorForm = this.fb.group({
       libelle: ['', [Validators.required]],
     });
 
     this.loadAuditors();
   }

   // Load data 
   loadAuditors(): void {
    this.loading = true;
    this.managementService.findCommissaires()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.auditors = data;
          this.loading = false;
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Categories des documents non chargées!');
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

  // Save the auditor
  saveAuditor(): void {
    if (!this.selectedItem?.id) {
      let auditor: any = {
        libelle: this.auditorForm.value.libelle,
      };

      this.managementService.saveCommissaire(auditor)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Auditor Ajouté avec Succès!');
            this.loadAuditors();
            this.resetForm();
          },
          error: () => {
            this.toastr.error('Erreur de sauvegarde!', 'Auditor non ajouté!');
          }
        });
    } else {
      this.updateAuditor();
    }
  }

  // Update the auditor
  updateAuditor(): void {
    let auditor: any = {
      id: this.selectedItem.id,
      libelle: this.auditorForm.value.libelle,
    };

    this.managementService.updateCommissaire(auditor)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', 'Auditor mis à jour avec succès!');
          this.loadAuditors();
          this.resetForm();
        },
        error: () => {
          this.toastr.error('Erreur lors de la mise à jour de l\'auditor !', 'Erreur');
        }
      });
  }

  // Delete the auditor
  deleteAuditor(): void {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService.deleteCommissaire(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Auditor supprimé avec succès!');
            this.loadAuditors();
            this.resetForm();
          },
          error: () => {
            this.toastr.error(
              "Il faut vérifier qu'aucun projet ni fonds n'utilise ce secteur d'activité!",
              'Erreur de suppression!'
            );
          }
        });
    }
  }

   // Open the add modal
   openAddModal(): void {
    this.resetForm();
    this.openModal = true;
  }

  // Toggle the show edit mode
  toggleShowEdit(data: any): void {
    if (data) {
      this.selectedItem = data;
      this.auditorForm.patchValue({ libelle: data.libelle });
      this.openModal = true;
    } else {
      this.resetForm();
    }
  }
  
  // Reset the form
  resetForm() {
    this.auditorForm.reset();
    this.selectedItem = undefined;
    this.openModal = false;
  }

 
}
