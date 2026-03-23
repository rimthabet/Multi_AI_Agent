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
  selector: 'legal-form',
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
  templateUrl: './legal-form.component.html',
  styleUrl: './legal-form.component.scss'
})
export class LegalFormComponent implements OnInit {

  //  Injects and ViewChild
  mp_delete_popup = viewChild.required<ElementRef>("mp_delete_popup");
  rest_url: string = environment.apiUrl + '/document-categories';

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  public legalFormForm!: FormGroup;

  loading: boolean = false;
  legalForms: any[] = [];
  selectedItem: any = null;
  openModal: boolean = false;
  delete_message: string =
    "Cette opération de suppression est considérée très dangereuse. Elle \
            va induire la suppression de tous les fonds d'investissement avec cette forme légale.";

  ngOnInit(): void {
    this.legalFormForm = this.fb.group({
      libelle: ['', [Validators.required]],
    });
    this.loadData();
  }

  // Load data 
  loadData(): void {
    this.loading = true;
    this.managementService.findCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.legalForms = data;
          this.loading = false;
        },
        error: () => {
          this.toastr.error('Erreur lors du chargement des catégories de documents !', 'Erreur');
          this.loading = false;
        }
      });
  }

  // Save the legal form
  saveLegalForm(): void {
    if (!this.selectedItem?.id) {
      let legalForm: any = {
        libelle: this.legalFormForm.value.libelle,
      };

      this.managementService.saveCategorie(legalForm)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Forme légale Ajoutée avec Succès!');
            this.loadData();
            this.resetForm();
          },
          error: () => {
            this.toastr.error('Erreur de sauvegarde!', 'Forme légale non ajoutée!');
          }
        });
    } else {
      this.updateLegalForm();
    }
  }

  // Update the legal form
  updateLegalForm(): void {
    let legalForm: any = {
      id: this.selectedItem.id,
      libelle: this.legalFormForm.value.libelle,
    };

    this.managementService.updateCategorie(legalForm)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', 'Forme légale mise à jour avec succès!');
          this.loadData();
          this.resetForm();
        },
        error: () => {
          this.toastr.error('Erreur lors de la mise à jour de la forme légale !', 'Erreur');
        }
      });
  }

  // Delete the legal form
  deleteLegalForm(): void {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService.deleteDocumentCategorie(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Forme légale supprimée avec succès!');
            this.loadData();
            this.resetForm();
          },
          error: () => {
            this.toastr.error('Erreur lors de la suppression de la forme légale !', 'Erreur');
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
      this.legalFormForm.patchValue({ libelle: data.libelle });
      this.openModal = true;
    } else {
      this.resetForm();
    }
  }

  // Reset the form
  resetForm() {
    this.legalFormForm.reset();
    this.selectedItem = undefined;
    this.openModal = false;
  }

}
