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
  selector: 'contribution-types',
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
  templateUrl: './contribution-types.component.html',
  styleUrl: './contribution-types.component.scss'
})
export class ContributionTypesComponent implements OnInit {

  //  Injects and ViewChild
  mp_delete_popup = viewChild.required<ElementRef>("mp_delete_popup");
  rest_url: string = environment.apiUrl + '/nature-bailleur-fonds';

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  public contributionTypeForm!: FormGroup;

  loading: boolean = false;
  contributionTypes: any[] = [];
  selectedItem: any = null;
  openModal: boolean = false;
  delete_message: string =
    "Cette opération de suppression est considérée très dangereuse. Elle \
            va induire la suppression de toutes les autres données dépendantes. \
            En l'occurence les financements dépendants, seront tous \
            supprimeés.";


  ngOnInit(): void {
    this.contributionTypeForm = this.fb.group({
      libelle: ['', [Validators.required]],
    });

    this.loadContributionTypes();
  }

  // Load data 
  loadContributionTypes(): void {
    this.loading = true;
    this.managementService.findNatureBailleurFonds()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.contributionTypes = data;
          this.loading = false;
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Critères de présélection non chargés!');
          this.loading = false;
        }
      });
  }

  // Save the contribution type
  saveContributionType(): void {
    if (!this.selectedItem?.id) {
      let contributionType: any = {
        libelle: this.contributionTypeForm.value.libelle,
      };

      this.managementService.saveNatureBailleurFonds(contributionType)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Nature de l\'apport Ajouté avec Succès!');
            this.loadContributionTypes();
            this.resetForm();
          },
          error: () => {
            this.toastr.error('Erreur de sauvegarde!', 'Critère de présélection non ajouté!');
          }
        });
    } else {
      this.updateContributionType();
    }
  }

  // Update the contribution type
  updateContributionType(): void {
    let contributionType: any = {
      id: this.selectedItem.id,
      libelle: this.contributionTypeForm.value.libelle,
    };

    this.managementService.updateNatureBailleurFonds(contributionType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', 'Nature de l\'apport mise à jour avec succès!');
          this.loadContributionTypes();
          this.resetForm();
        },
        error: () => {
          this.toastr.error('Erreur lors de la mise à jour du critère de présélection !', 'Erreur');
        }
      });
  }


  // Delete the contribution type
  deleteContributionType(): void {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService.deleteNatureBailleurFonds(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Nature de l\'apport supprimé avec succès!');
            this.loadContributionTypes();
            this.resetForm();
          },
          error: () => {
            this.toastr.error('Erreur lors de la suppression du critère de présélection !', 'Erreur');
          }
        });
    }
  }

  // Open the add modal
  openAddModal(): void {
    this.selectedItem = null;
    this.openModal = true;
  }

 // Toggle the show edit mode
 toggleShowEdit(data: any): void {
  if (data) {
    this.selectedItem = data;
    this.contributionTypeForm.patchValue({ libelle: data.libelle });
    this.openModal = true;
  } else {
    this.resetForm();
  }
}

  // Reset the form
  resetForm() {
    this.contributionTypeForm.reset();
    this.selectedItem = undefined;
    this.openModal = false;
  }
}
