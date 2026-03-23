import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ManagementService } from '../../services/management.service';

@Component({
  selector: 'vote-type',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
  ],
  templateUrl: './election-type.component.html',
  styleUrl: './election-type.component.scss'
})
export class ElectionTypeComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  public voteTypeForm!: FormGroup;

  loading: boolean = false;
  voteTypes: any[] = [];
  selectedItem: any = null;
  openModal: boolean = false;


  ngOnInit(): void {
    this.voteTypeForm = this.fb.group({
      libelle: ['', [Validators.required]],
    });

    this.loadVoteTypes();
  }

  loadVoteTypes(): void {
    this.loading = true;
    this.managementService.findTypesVote()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.voteTypes = data;
          this.loading = false;
        },
        error: () => {
          this.toastr.error('Erreur lors du chargement des types de vote !', 'Erreur');
          this.loading = false;
        }
      });
  }

  // Save the vote type
  saveVoteType(): void {
    if (!this.selectedItem?.id) {
      let voteType: any = {
        libelle: this.voteTypeForm.value.libelle,
      };

      this.managementService.saveTypeVote(voteType)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Type de vote Ajouté avec Succès!');
            this.loadVoteTypes();
            this.resetForm();
          },
          error: () => {
            this.toastr.error('Erreur de sauvegarde!', 'Type de vote non ajouté!');
          }
        });
    } else {
      this.updateVoteType();
    }
  }

  // Update the vote type
  updateVoteType(): void {
    let voteType: any = {
      id: this.selectedItem.id,
      libelle: this.voteTypeForm.value.libelle,
    };

    this.managementService.updateTypeVote(voteType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', 'Type de vote mis à jour avec succès!');
          this.loadVoteTypes();
          this.resetForm();
        },
        error: () => {
          this.toastr.error('Erreur lors de la mise à jour du type de vote !', 'Erreur');
        }
      });
  }

  // Delete the vote type
  deleteVoteType(): void {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService.deleteTypeVote(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Type de vote supprimé avec succès!');
            this.loadVoteTypes();
            this.resetForm();
          },
          error: () => {
            this.toastr.error(
              "Il faut véifier qu'aucune decision/resolution n'utilise ce type de vote!",
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
      this.voteTypeForm.patchValue({ libelle: data.libelle });
      this.openModal = true;
    } else {
      this.resetForm();
    }
  }

  // Reset the form
  resetForm() {
    this.voteTypeForm.reset();
    this.selectedItem = undefined;
    this.openModal = false;
  }
}


