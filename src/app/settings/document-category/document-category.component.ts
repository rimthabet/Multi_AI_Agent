import { Component, DestroyRef, ElementRef, inject, OnInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { CdsButtonModule, CdsDividerModule, CdsIconModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ManagementService } from '../../services/management.service';
import { environment } from '../../../environment/environment';
import { MultiPurposeDeleteDialogComponent } from '../../tools/multi-purpose-delete-dialog/multi-purpose-delete-dialog.component';

@Component({
  selector: 'document-categorie',
  imports: [ClarityModule,CdsButtonModule, CdsIconModule, CdsDividerModule, CommonModule, FormsModule, ReactiveFormsModule, MultiPurposeDeleteDialogComponent],
  templateUrl: './document-category.component.html',
  styleUrl: './document-category.component.scss'
})
export class DocumentCategoryComponent implements OnInit {

  //  Injects and ViewChild
  mp_delete_popup = viewChild.required<ElementRef>("mp_delete_popup");

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  public categorieForm!: FormGroup;

  delete_message: string = "Cette opération de suppression est considérée très dangereuse. Elle \
            va induire la suppression de toutes les autres données dépendantes. \
            En l'occurence, tous les types des documents, les documents, les \
            conformités documentaires, les listes de contrôle et les fichiers sur disques, dépendants, seront tous \
            supprimeés.";

  editMode: boolean = false;
  documentCategories: any[] = [];
  selectedItem: any = null;
  openModal: boolean = false;
  loading: boolean = false;
  rest_url: string = environment.apiUrl + '/document-categories';

  ngOnInit(): void {

    this.categorieForm = this.fb.group({
      libelle: ['', [Validators.required]],
    });

    this.loadCategories();
  }

  // Load data 
  loadCategories(): void {
    this.loading = true;
    this.managementService.findCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.documentCategories = data;
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Catégories de documents non chargées!');
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

  // Save the category t
  saveCategorie(): void {
    if (!this.selectedItem?.id) {
      let categorie: any = {
        libelle: this.categorieForm?.value['libelle'],
      };
      this.managementService.saveCategorie(categorie)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Catégorie Ajoutée avec Succès!');
            this.loadCategories();
            this.resetForm();
          },
          error: () => {
            this.toastr.error('Erreur de sauvegarde!', 'Catégorie non ajoutée!');
          }
        });
    } else {
      this.updateCategorie();
    }
  }

  // Update the category 
  updateCategorie(): void {
    if (this.categorieForm.invalid) {
      this.toastr.error('Le libellé ne peut pas être vide !');
      return;
    }

    const categorie = {
      id: this.selectedItem.id,
      libelle: this.categorieForm.value.libelle
    };

    this.managementService.updateCategorie(categorie)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', 'Catégorie mise à jour avec succès!');
          this.loadCategories();
          this.toggleShowEdit(null);
        },
        error: () => {
          this.toastr.error('Erreur de sauvegarde!', 'Catégorie non mise à jour!');
        }
      });

    this.resetForm();
  }

  // Delete the category
  deleteCategorie(): void {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService.deleteDocumentCategorie(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadCategories();
            this.toastr.success('', 'Catégorie de documents supprimée avec succès!');
          },
          error: () => {
            this.toastr.error('Erreur de suppression!', "Il faut vérifier qu'aucun document type n'utilise cette catégorie!");
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
      this.categorieForm.patchValue({ libelle: data.libelle });
      this.openModal = true;
    } else {
      this.resetForm();
    }
  }

  // Reset the form
  resetForm() {
    this.categorieForm.reset();
    this.selectedItem = undefined;
    this.openModal = false;
  }
}
