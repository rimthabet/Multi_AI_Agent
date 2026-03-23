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
  selector: 'sector',
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
  templateUrl: './sector.component.html',
  styleUrl: './sector.component.scss'
})
export class SectorComponent implements OnInit {

  //  Injects and ViewChild
  mp_delete_popup = viewChild.required<ElementRef>("mp_delete_popup");
  rest_url: string = environment.apiUrl + '/secteurs';

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  public secteurForm!: FormGroup;

  loading: boolean = false;
  secteurs: any[] = [];
  selectedItem: any = null;
  openModal: boolean = false;
  delete_message: string =
    "Cette opération de suppression est considérée très dangereuse. Elle \
            va induire la suppression de toutes les autres données dépendantes. \
            En l'occurence, tous les projets, les libérations ... dépendants, seront tous \
            supprimeés.";

  ngOnInit(): void {
    this.secteurForm = this.fb.group({
      libelle: ['', [Validators.required]],
    });

    this.loadSecteurs();
  }

  // Load data 
  loadSecteurs(): void {
    this.loading = true;
    this.managementService.findSecteurs()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.secteurs = data;
          this.loading = false;
        },
        error: () => {
          this.toastr.error('Erreur lors du chargement des secteurs !', 'Erreur');
          this.loading = false;
        }
      });
  }

  // Save the sector
  saveSector(): void {
    if (!this.selectedItem?.id) {
      let secteur: any = {
        libelle: this.secteurForm.value.libelle,
      };

      this.managementService.saveSecteur(secteur)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Secteur Ajouté avec Succès!');
            this.loadSecteurs();
            this.resetForm();
          },
          error: () => {
            this.toastr.error('Erreur de sauvegarde!', 'Secteur non ajouté!');
          }
        });
    } else {
      this.updateSector();
    }
  }

  // Update the sector
  updateSector(): void {
    let secteur: any = {
      id: this.selectedItem.id,
      libelle: this.secteurForm.value.libelle,
    };

    this.managementService.updateSecteur(secteur)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', 'Secteur mis à jour avec succès!');
          this.loadSecteurs();
          this.resetForm();
        },
        error: () => {
          this.toastr.error('Erreur lors de la mise à jour du secteur !', 'Erreur');
        }
      });
  }

  // Delete the sector
  deleteSector(): void {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService.deleteSecteur(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Secteur supprimé avec succès!');
            this.loadSecteurs();
            this.resetForm();
          },
          error: () => {
            this.toastr.error(
              "Il faut vérifier qu'aucun projet ni fonds n'utilise ce secteur d'activité!",
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
      this.secteurForm.patchValue({ libelle: data.libelle });
      this.openModal = true;
    } else {
      this.resetForm();
    }
  }

  // Reset the form
  resetForm() {
    this.secteurForm.reset();
    this.selectedItem = undefined;
    this.openModal = false;
  }
}
