import { Component, DestroyRef, ElementRef, inject, OnInit, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { CdsButtonModule, CdsDividerModule, CdsIconModule } from '@cds/angular';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MultiPurposeDeleteDialogComponent } from '../../tools/multi-purpose-delete-dialog/multi-purpose-delete-dialog.component';
import { ManagementService } from '../../services/management.service';
import { environment } from '../../../environment/environment';

@Component({
  selector: 'task',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsDividerModule,
    CdsIconModule,
    MultiPurposeDeleteDialogComponent,
  ],
  templateUrl: './treatment-task.component.html',
  styleUrl: './treatment-task.component.scss'
})
export class TreatmentTaskComponent implements OnInit {

  //  Injects and ViewChild
  mp_delete_popup = viewChild.required<ElementRef>("mp_delete_popup");

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  public tacheForm!: FormGroup;

  delete_message: string =
    "Cette opération de suppression est considérée très dangereuse.\
     Elle va induire la suppression de toutes les autres données dépendantes. \
     En l'occurrence, tous les types des documents, les documents,\
      les conformités documentaires, les listes de contrôle et les fichiers sur disques dépendants seront tous supprimés.";

  taches: any[] = [];
  selectedItem: any = null;
  openModal = false;
  filtered_taches: any[] = [];
  phases: any[] = [];
  selectedPhases: Set<any> = new Set();
  scope: number | undefined;

  loading = false;

  rest_url: string = environment.apiUrl + '/tache';


  ngOnInit(): void {
    this.tacheForm = this.fb.group({
      phase: [undefined, [Validators.required]],
      libelle: [undefined, [Validators.required]],
      rang: [0, [Validators.required]],
    });

    this.managementService
      .findPhases()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.phases = data;
        },
        error: () => {
          this.toastr.error("Erreur lors du chargement des phases !", "Erreur");
        }
      });

    this.loadTaches();
  }



  loadTaches() {
    this.loading = true;
    this.managementService.findTache()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          data.sort((a: any, b: any) =>
            a.phase.typeValeur > b.phase.typeValeur
              ? 1
              : a.phase.typeValeur < b.phase.typeValeur
                ? -1
                : 0
          );
          this.taches = data;
          this.filterData();
        },
        error: () => {
          this.toastr.error("Erreur lors du chargement des tâches !", "Erreur");
        },
        complete: () => {
          this.loading = false;
        },
      });
  }



  // Save the phase 
  saveTache() {
    if (!this.selectedItem?.id) {
      const tache: any = {
        libelle: this.tacheForm?.controls['libelle'].value,
        phase: this.phases.find(
          (e) => e?.id == this.tacheForm?.controls['phase'].value
        ),
        rang: this.tacheForm?.controls['rang'].value,
      };

      this.managementService.saveTache(tache)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (phase: any) => {
            this.toastr.success('', 'Tâche ajoutée avec succès !');
            this.loadTaches();
            this.resetForm();
            this.openModal = false;
          },
          error: () => {
            this.toastr.error('Erreur lors de l\'ajout de la tâche !', 'Erreur');
          }
        });
    } else {
      this.updateTache();
    }
  }


  // Update the task 
  updateTache() {
    const tache: any = {
      id: this.selectedItem.id,
      libelle: this.tacheForm?.controls['libelle'].value,
      rang: this.tacheForm?.controls['rang'].value,
      phase: this.phases.find(
        (e) => e?.id == this.tacheForm?.controls['phase'].value
      ),
    };

    this.managementService.updateTache(tache)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tache: any) => {
          this.toastr.success('', 'Tâche mise à jour avec succès !');
          this.loadTaches();
          this.toggleShowEdit(null);
          this.resetForm();
        },
        error: () => {
          this.toastr.error('Erreur lors de la mise à jour de la tâche !', 'Erreur');
        }
      });
  }



  // Delete the task 
  deleteTache(): void {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService
        .deleteTache(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadTaches();
            this.toastr.success('', 'Tache supprimée avec succès!');
          },
          error: () => {
            this.toastr.error(
              'Erreur de suppression!',
              "Il faut vérifier qu'aucun document type n'utilise cette catégorie!"
            );
          },
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
      this.tacheForm.patchValue({
        phase: data.phase.id,
        libelle: data.libelle,
        rang: data.rang,
      });

      this.openModal = true;
    } else {
      this.resetForm();
    }
  }

  // Select a phase 
  selectPhase(ph: any) {
    this.selectedPhases.add(ph);
    this.filterData();
  }

  // Clear a phase 
  clearPhase(ph: any) {
    this.selectedPhases.delete(ph);
    this.filterData();
  }

  // Filter data 
  filterData() {
    if (this.selectedPhases.size > 0) {
      this.filtered_taches = this.taches.filter((type: any) => {
        return (
          [...this.selectedPhases].filter((cat: any) => cat.id == type.phase.id)
            .length > 0
        );
      });
    } else {
      this.filtered_taches = [...this.taches];
    }

    this.filtered_taches.sort((a: any, b: any) =>
      a.phase.typeValeur > b.phase.typeValeur
        ? 1
        : a.phase.typeValeur < b.phase.typeValeur
          ? -1
          : 0
    );
  }

  // Reset the form 
  resetForm(): void {
    this.tacheForm.reset({
      phase: undefined,
      libelle: undefined,
      rang: 0
    });
    this.selectedItem = null;
    this.openModal = false;
  }


}
