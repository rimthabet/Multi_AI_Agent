import { Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdsButtonModule, CdsDividerModule, CdsIconModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
 import { ToastrService } from 'ngx-toastr';
 import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MultiPurposeDeleteDialogComponent } from '../../tools/multi-purpose-delete-dialog/multi-purpose-delete-dialog.component';
import { environment } from '../../../environment/environment';
import { ManagementService } from '../../services/management.service';

@Component({
  selector: 'preselection-criteria',
  imports: [CdsButtonModule, CdsDividerModule, CdsIconModule, ClarityModule, MultiPurposeDeleteDialogComponent, FormsModule, ReactiveFormsModule],
  templateUrl: './preselection-criteria.component.html',
  styleUrl: './preselection-criteria.component.scss'
})
export class PreselectionCriteriaComponent {

  //  Injects and ViewChild
  mp_delete_popup = viewChild.required<ElementRef>("mp_delete_popup");
  rest_url: string = environment.apiUrl + '/critere-preselection';

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  public preselectionCriteriaForm!: FormGroup;

  loading: boolean = false;
  criteria: any[] = [];
  selectedItem: any = null;
  openModal: boolean = false;
  delete_message: string = "Cette opération de suppression est considérée très dangereuse. Elle \
            va induire la suppression de tous les investissements dépendants des projets.";

  ngOnInit(): void {
    this.preselectionCriteriaForm = this.fb.group({
      libelle: ['', [Validators.required]],
    });

    this.loadPreselectionCriteria();
  }

  // Load data 
  loadPreselectionCriteria(): void {
    this.loading = true;
    this.managementService.findCriteresPreselection()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.criteria = data;
          this.loading = false;
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Critères de présélection non chargés!');
          this.loading = false;
        }
      });
  }

  // Save the preselection criteria
  savePreselectionCriteria(): void {
    if (!this.selectedItem?.id) {
      let preselectionCriteria: any = {
        libelle: this.preselectionCriteriaForm.value.libelle,
      };

      this.managementService.saveCriteresPreselection(preselectionCriteria)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Critère de présélection Ajouté avec Succès!');
            this.loadPreselectionCriteria();
            this.resetForm();
          },
          error: () => {
            this.toastr.error('Erreur de sauvegarde!', 'Critère de présélection non ajouté!');
          }
        });
    } else {
      this.updatePreselectionCriteria();
    }
  }


  // Update the preselection criteria
  updatePreselectionCriteria(): void {
    let preselectionCriteria: any = {
      id: this.selectedItem.id,
      libelle: this.preselectionCriteriaForm.value.libelle,
    };

    this.managementService.updateCriteresPreselection(preselectionCriteria)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', 'Critère de présélection mise à jour avec succès!');
          this.loadPreselectionCriteria();
          this.resetForm();
        },
        error: () => {
          this.toastr.error('Erreur lors de la mise à jour du critère de présélection !', 'Erreur');
        }
      });
  }

  // Delete the preselection criteria
  deletePreselectionCriteria(): void {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService.deleteCriterePreselection(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Critère de présélection supprimé avec succès!');
            this.loadPreselectionCriteria();
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
    this.resetForm();
    this.openModal = true;
  }

  // Toggle the show edit mode
  toggleShowEdit(data: any): void {
    if (data) {
      this.selectedItem = data;
      this.preselectionCriteriaForm.patchValue({ libelle: data.libelle });
      this.openModal = true;
    } else {
      this.resetForm();
    }
  }

  // Reset the form
  resetForm() {
    this.preselectionCriteriaForm.reset();
    this.selectedItem = undefined;
    this.openModal = false;
  }

}
