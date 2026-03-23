import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ManagementService } from '../../services/management.service';

@Component({
  selector: 'output-type',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule
  ],
  templateUrl: './exit-type.component.html',
  styleUrl: './exit-type.component.scss'
})
export class ExitTypeComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  public outputTypeForm!: FormGroup;

  loading: boolean = false;
  outputTypes: any[] = [];
  selectedItem: any = null;
  openModal: boolean = false;


  ngOnInit(): void {
    this.outputTypeForm = this.fb.group({
      libelle: ['', [Validators.required]],
    });

    this.loadOutputTypes();
  }

  // Load data 
  loadOutputTypes(): void {
    this.loading = true;
    this.managementService.findTypesSortie()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.outputTypes = data;
          this.loading = false;
        },
        error: () => {
          this.toastr.error('Erreur lors du chargement des types de sortie !', 'Erreur');
          this.loading = false;
        }
      });
  }

  // Save the output type
  saveOutputType(): void {
    if (!this.selectedItem?.id) {
      let outputType: any = {
        libelle: this.outputTypeForm.value.libelle,
      };

      this.managementService.saveTypeSortie(outputType)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Type de sortie ajouté avec Succès!');
            this.loadOutputTypes();
            this.resetForm();
          },
          error: () => {
            this.toastr.error('Erreur de sauvegarde!', 'Type de sortie non ajouté!');
          }
        });
    } else {
      this.updateOutputType();
    }
  }


  // Update the output type
  updateOutputType(): void {
    let outputType: any = {
      id: this.selectedItem.id,
      libelle: this.outputTypeForm.value.libelle,
    };

    this.managementService.updateTypeSortie(outputType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', 'Type de sortie mis à jour avec succès!');
          this.loadOutputTypes();
          this.resetForm();
        },
        error: () => {
          this.toastr.error('Erreur lors de la mise à jour du type de sortie !', 'Erreur');
        }
      });
  }

  // Delete the output type
  deleteOutputType(): void {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService.deleteTypeSortie(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Type de sortie supprimé avec succès!');
            this.loadOutputTypes();
            this.resetForm();
          },
          error: () => {
            this.toastr.error(
              "Il faut vérifier qu'aucun projet ni fonds n'utilise ce type de sortie!",
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
      this.outputTypeForm.patchValue({ libelle: data.libelle });
      this.openModal = true;
    } else {
      this.resetForm();
    }
  }

  // Reset the form
  resetForm() {
    this.outputTypeForm.reset();
    this.selectedItem = undefined;
    this.openModal = false;
  }

}
