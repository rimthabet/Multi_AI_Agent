import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ClarityModule } from '@clr/angular';
import { CdsButtonModule, CdsDividerModule, CdsIconModule } from '@cds/angular';
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'document-checklist',
  imports: [
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './document-checklist.component.html',
  styleUrl: './document-checklist.component.scss',
})
export class DocumentChecklistComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);

  checklistSaveForm!: FormGroup<any>;

  crud_modal_open: boolean = false;
  loading: boolean = false;
  conformiteDocumentaires: any[] = [];
  typesInvestments: any[] = [];

  checklists: any[] | undefined;
  selectedChecklist: any = [];

  ngOnInit(): void {
    this.checklistSaveForm = this.formBuilder.group({
      libelle: [undefined, [Validators.required]],
      typeInvestissement: [undefined, [Validators.required]],
      conformiteDocumentaires: [undefined, [Validators.required]],
    });

    this.loadTypesInvestissement();
    this.loadDocumentCompliances();

    this.loadCheckLists();
  }
  // Load data
  loadDocumentCompliances() {
    this.loading = true;
    this.managementService
      .findConformites()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.conformiteDocumentaires = data.map((d: any) => ({
            ...d,
            libelle: d.documentType?.libelle,
          }));
          this.conformiteDocumentaires.sort((a: any, b: any) => a.libelle.localeCompare(b.libelle));
        },
        error: () => {
          this.toastr.error(
            'Erreur de chargement!',
            'Conformités non chargées!'
          );
        },
        complete: () => {
          this.loading = false;
        },
      });
  }
  // Load type of Investment
  loadTypesInvestissement() {
    this.managementService
      .findTypeInvestissement()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.typesInvestments = data;
        },
        error: () => {
          this.toastr.error(
            'Erreur de chargement!',
            "Types d'investissement non chargés!"
          );
        },
      });
  }

  // Load data
  loadCheckLists() {
    this.loading = true;
    this.managementService
      .findChecklists()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.checklists = data;
        },
        error: () => {
          this.toastr.error(
            'Erreur de chargement!',
            'Listes de contrôle non chargées!'
          );
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  filterDocuments = (search: string, item: any) => {
    if (!search) return true;
    return item?.documentType?.libelle?.includes(search.toLowerCase());
  };

  // We call save systimatically and we switch internally
  saveChecklist() {
    if (!this.selectedChecklist?.id) {
      let checklist: any = {
        libelle: this.checklistSaveForm?.value['libelle'],
        typeInvestissement: this.checklistSaveForm?.value['typeInvestissement'],
        conformiteDocumentaires:
          this.checklistSaveForm?.value['conformiteDocumentaires'],
      };

      this.managementService
        .saveChecklist(checklist)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success(
              '',
              'Liste de contrôle documentaire ajoutée avec succès!'
            );
            this.loadCheckLists();
            this.hideChecklistModal();
            this.resetForm();
          },
          error: (error: any) =>
            this.toastr.error(
              '',
              "Échec d'ajout de liste de contrôle, vérifier qu'il n'existe pas déja une liste pour ce type d'investissement!"
            ),
        });
    } else {
      this.updateChecklist();
    }
  }

  // Update checklist
  updateChecklist() {
    let checklist: any = {
      id: this.selectedChecklist.id,
      libelle: this.checklistSaveForm?.value['libelle'],
      typeInvestissement: this.checklistSaveForm?.value['typeInvestissement'],
      conformiteDocumentaires:
        this.checklistSaveForm?.value['conformiteDocumentaires'],
    };
    this.managementService
      .updateChecklist(checklist)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', 'Liste de contrôle modifiée avec succès!');
          this.loadCheckLists();
          this.showEdit(false);
        },
        error: () => {
          this.toastr.error(
            'Erreur de sauvegarde!',
            'Liste de contrôle non mise à jour!'
          );
        },
      });
  }

  // Delete checklist
  deleteChecklists() {
    if (confirm('Vous êtes sur de supprimer cette liste de contrôle ?')) {
      if (this.selectedChecklist.id) {
        this.managementService
          .deleteChecklist(this.selectedChecklist.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.toastr.success(
                '',
                'Liste de contrôle supprimée avec succès !'
              );
              this.loadCheckLists();
            },
            error: () => {
              this.toastr.error(
                'Erreur de suppression!',
                'Liste de contrôle non supprimée!'
              );
            },
          });
      }
    }
  }

  // Show edit form
  showEdit(param: boolean): void {
    if (param && this.selectedChecklist) {
      this.checklistSaveForm.patchValue({
        libelle: this.selectedChecklist?.libelle,
        typeInvestissement: this.selectedChecklist?.typeInvestissement,
        conformiteDocumentaires:
          this.selectedChecklist?.conformiteDocumentaires,
      });

      this.crud_modal_open = true;
    } else {
      this.crud_modal_open = false;
    }
  }

  equals(a: any, b: any) {
    return a?.id == b?.id;
  }

  // Hide checklist modal
  hideChecklistModal() {
    this.crud_modal_open = false;
  }
  // Reset the form
  resetForm() {
    this.checklistSaveForm.reset();
    this.selectedChecklist = undefined;
    this.crud_modal_open = false;
  }
}
