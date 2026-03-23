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
  selector: 'institution',
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
  templateUrl: './institution.component.html',
  styleUrl: './institution.component.scss'
})
export class InstitutionComponent implements OnInit {

  //  Injects and ViewChild
  mp_delete_popup = viewChild.required<ElementRef>("mp_delete_popup");
  rest_url: string = environment.apiUrl + '/etablissements';

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  public institutionForm!: FormGroup;

  loading: boolean = false;
  institutions: any[] = [];
  selectedItem: any = null;
  openModal: boolean = false;
  delete_message: string =
    "Cette opération de suppression est considérée très dangereuse. Elle \
            va induire la suppression de toutes les autres données dépendantes. \
            En l'occurence les souscripteurs dépendants, seront tous \
            supprimeés.";

  ngOnInit(): void {
    this.institutionForm = this.fb.group({
      libelle: ['', [Validators.required]],
    });

    this.loadInstitutions();
  }

  // Load data 
  loadInstitutions(): void {
    this.loading = true;
    this.managementService.findEtablisements()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.institutions = data;
          this.loading = false;
        },
        error: () => {
          this.toastr.error('Erreur lors du chargement des institutions !', 'Erreur');
          this.loading = false;
        }
      });
  }

  // Save the institution
  saveInstitution(): void {
    if (!this.selectedItem?.id) {
      let institution: any = {
        libelle: this.institutionForm.value.libelle,
      };

      this.managementService.saveEtablissement(institution)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Institution Ajoutée avec Succès!');
            this.loadInstitutions();
            this.resetForm();
          },
          error: () => {
            this.toastr.error('Erreur de sauvegarde!', 'Institution non ajoutée!');
          }
        });
    } else {
      this.updateInstitution();
    }
  }

  // Update the institution
  updateInstitution(): void {
    let institution: any = {
      id: this.selectedItem.id,
      libelle: this.institutionForm.value.libelle,
    };

    this.managementService.updateEtablissement(institution)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', 'Institution mise à jour avec succès!');
          this.loadInstitutions();
          this.resetForm();
        },
        error: () => {
          this.toastr.error('Erreur lors de la mise à jour de l\'institution !', 'Erreur');
        }
      });
  }

  // Delete the institution
  deleteInstitution(): void {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService.deleteEtablissement(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Institution supprimée avec succès!');
            this.loadInstitutions();
            this.resetForm();
          },
          error: () => {
            this.toastr.error(
              "Il faut vérifier qu'aucun souscripteur n'utilise cette institution!",
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
      this.institutionForm.patchValue({ libelle: data.libelle });
      this.openModal = true;
    } else {
      this.resetForm();
    }
  }

  // Reset the form
  resetForm() {
    this.institutionForm.reset();
    this.selectedItem = undefined;
    this.openModal = false;
  }
}
