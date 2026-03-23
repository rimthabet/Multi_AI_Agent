import { Component, DestroyRef, inject, OnInit, ElementRef, viewChild, } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule,FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClarityModule } from '@clr/angular';
import { CdsButtonModule, CdsDividerModule, CdsIconModule } from '@cds/angular';
import { MultiPurposeDeleteDialogComponent } from '../../tools/multi-purpose-delete-dialog/multi-purpose-delete-dialog.component';
import { ManagementService } from '../../services/management.service';
import { environment } from '../../../environment/environment';

@Component({
  selector: 'document-type',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    MultiPurposeDeleteDialogComponent
  ],
  templateUrl: './document-type.component.html',
  styleUrl: './document-type.component.scss',
})
export class DocumentTypeComponent implements OnInit {

  //  Injects and ViewChild
  mp_delete_popup = viewChild.required<ElementRef>("mp_delete_popup");

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  rest_url: string = environment.apiUrl + '/document-types';

  delete_message: string =
    "Cette opération de suppression est considérée très dangereuse. Elle " +
    "va induire la suppression de toutes les autres données dépendantes. " +
    "En l'occurrence, tous les documents, les conformités documentaires, les listes de contrôle et les fichiers sur disques, dépendants, seront tous supprimés.";

  libelle = '';
  description = '';
  editMode = false;
  loading = false;
  selectedItem: any;

  types: any[] = [];
  filtered_types: any[] = [];
  categories: any[] = [];
  selectedCategories: Set<any> = new Set();

  saveForm = this.fb.group({
    libelle: ['', Validators.required],
    description: [''],
    categorie: [null, Validators.required],
  });

  ngOnInit(): void {
    this.loadData();
    this.loadCategories();
  }

  // Load categories
  loadCategories(): void {
    this.managementService.findCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: (data: any) => {
          this.categories = data;
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Catégories non chargées!');
        }
      }
    );
  }

  // Load data
  loadData(): void {
    this.loading = true;
    this.managementService.findDocumentTypes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: (data: any) => {
          data.sort((a: any, b: any) => {
            if (a.categorie.libelle > b.categorie.libelle) return 1;
            if (a.categorie.libelle < b.categorie.libelle) return -1;
            return 0;
          });
          this.types = data;
          this.filtered_types = data;
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Types de documents non chargés!');
        },
        complete: () => {
          this.loading = false;
        }
      }
    );
  }

  // Show edit
  showEdit(param: boolean) {
    if (param) {
      this.saveForm.patchValue({
        libelle: this.selectedItem?.libelle ?? '',
        description: this.selectedItem?.description ?? '',
        categorie: this.selectedItem?.categorie ?? null,
      });
    } else {
      this.saveForm.reset();
      this.selectedItem = null;
    }
    this.editMode = param;
  }

  // Save document type
  save() {
    if (!this.selectedItem) {
      const type = this.saveForm.getRawValue();
      this.managementService
        .saveDocumentType(type)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(
          {
            next: () => {
              this.toastr.success('', 'Type document ajouté avec succès!');
              this.loadData();
              this.showEdit(false);
            },
            error: () => {
              this.toastr.error('Erreur de sauvegarde!', 'Type document non ajouté!');
            }
          }
        );
    } else {
      this.update();
    }
  }

  // Update document type
  update() {
    const type = {
      ...this.saveForm.getRawValue(),
      id: this.selectedItem.id,
    };

    this.managementService
      .updateDocumentType(type)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(
        {
          next: () => {
            this.toastr.success('', 'Type document mis à jour avec succès!');
            this.loadData();
            this.showEdit(false);
          },
          error: () => {
            this.toastr.error('Erreur de sauvegarde!', 'Type document non mis à jour!');
          }
        }
      );
  }

  selectCategorie(cat: any) {
    this.selectedCategories.add(cat);
    this.filterData();
  }

  clearCategorie(cat: any) {
    this.selectedCategories.delete(cat);
    this.filterData();
  }

  // Filter data
  filterData() {
    if (this.selectedCategories.size > 0) {
      const selectedIds = new Set(
        [...this.selectedCategories].map((cat: any) => cat.id)
      );
      this.filtered_types = this.types.filter((type: any) =>
        selectedIds.has(type.categorie.id)
      );
    } else {
      this.filtered_types = [...this.types];
    }

    this.filtered_types.sort((a: any, b: any) =>
      a.categorie.libelle.localeCompare(b.categorie.libelle)
    );
  }

  // Delete document type
  deleteDocumentType() {
    if (confirm('Veuillez confirmer cette suppression !') && this.selectedItem?.id) {
      this.managementService
        .deleteDocumentType(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(
          {
            next: () => {
              this.loadData();
              this.toastr.success('', 'Type de documents supprimé avec succès!');
            },
            error: () => {
              this.toastr.error(
                'Erreur de suppression!',
                "Il faut vérifier qu'aucun document ni conformité documentaire n'utilise ce type de document!"
              );
            }
          }
        );
    }
  }

  equals(a: any, b: any): boolean {
    return a?.id === b?.id;
  }
}
