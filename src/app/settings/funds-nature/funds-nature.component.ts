import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, inject, OnInit, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MultiPurposeDeleteDialogComponent } from '../../tools/multi-purpose-delete-dialog/multi-purpose-delete-dialog.component';
import { environment } from '../../../environment/environment';
import { ManagementService } from '../../services/management.service';

@Component({
  selector: 'funds-nature',
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
  templateUrl: './funds-nature.component.html',
  styleUrl: './funds-nature.component.scss'
})
export class FundsNatureComponent implements OnInit {

  //  Injects and ViewChild
  mp_delete_popup = viewChild.required<ElementRef>("mp_delete_popup");
  rest_url: string = environment.apiUrl + '/natures';

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  public natureForm!: FormGroup;

  delete_message: string =
    "Cette opération de suppression est considérée très dangereuse. Elle \
            va induire la suppression de tous les fonds d'investissement de cette nature.";

  loading: boolean = false;
  natures: any[] = [];
  selectedItem: any = null;
  openModal: boolean = false;

  ngOnInit(): void {
    this.natureForm = this.fb.group({
      libelle: ['', [Validators.required]],
    });

    this.loadNatures();
  }

  // Load data 
  loadNatures(): void {
    this.loading = true;
    this.managementService.findNatures()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.natures = data;
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Natures des fonds non chargées!');
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

  // Save the nature
  saveNature(): void {
    if (!this.selectedItem?.id) {
      let nature: any = {
        libelle: this.natureForm.value.libelle,
      };

      this.managementService.saveNature(nature)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Nature Ajoutée avec Succès!');
            this.loadNatures();
            this.resetForm();
          },
          error: () => {
            this.toastr.error('Erreur de sauvegarde!', 'Nature non ajoutée!');
          }
        });
    } else {
      this.updateNature();
    }
  }

  // Update the nature
  updateNature(): void {
    let nature: any = {
      id: this.selectedItem.id,
      libelle: this.natureForm.value.libelle,
    };

    this.managementService.updateNature(nature)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', 'Nature mise à jour avec succès!');
          this.loadNatures();
          this.resetForm();
        },
        error: () => {
          this.toastr.error('Erreur lors de la mise à jour de la nature !', 'Erreur');
        }
      });
  }

 // Delete the nature
 deleteNature(): void {
  if (confirm('Veuillez confirmer cette suppression !')) {
    this.managementService.deleteNature(this.selectedItem.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', 'Nature supprimée avec succès!');
          this.loadNatures();
          this.resetForm();
        },
        error: () => {
          this.toastr.error(
            "Il faut vérifier qu'aucun fonds n'utilise cette nature!",
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
      this.natureForm.patchValue({ libelle: data.libelle });
      this.openModal = true;
    } else {
      this.resetForm();
    }
  } 

  // Reset the form
  resetForm() {
    this.natureForm.reset();
    this.selectedItem = undefined;
    this.openModal = false;
  }

}
