import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule, CdsFormsModule } from '@cds/angular';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ManagementService } from '../../services/management.service';

@Component({
  selector: 'funds-status',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    CdsFormsModule
],
  templateUrl: './funds-status.component.html',
  styleUrl: './funds-status.component.scss'
})
export class FundsStatusComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  public statusForm!: FormGroup;
  openModal: boolean = false;
  loading: boolean = false;
  etats: any[] = [];
  selectedItem: any = null;
  selectedColor: Set<any> = new Set();

  editMode: boolean = false;

  ngOnInit(): void {
    this.statusForm = this.fb.group({
      libelle: ['', [Validators.required]],
      couleur: ['', [Validators.required]],
      couleur_assist: ['']
    });

    this.statusForm.controls['couleur_assist'].valueChanges.subscribe(
      (value: any) => this.statusForm.controls['couleur'].setValue(value)
    );

    this.loadData();
  }


  // Load data
  loadData(): void {
    this.loading = true;
    this.managementService.findEtatsFonds()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          // Trier les données alphabétiquement par libellé
          data.sort((a: any, b: any) => {
            if (a.libelle > b.libelle) return 1;
            if (a.libelle < b.libelle) return -1;
            return 0;
          });
  
          // Affecter les données triées à l'attribut etats
          this.etats = data;
        },
        error: () => {
          this.toastr.error('Erreur lors du chargement des états de fonds !', 'Erreur');
        },
        complete: () => {
          this.loading = false;
        }
      });
  }


  // Save status
  saveStatus() {
    if (
      this.statusForm.value['libelle'] === undefined ||
      this.statusForm.value['libelle'].trim() === ''
    ) {
      this.toastr.error('Le libellé ne peut pas être vide !');
      return;
    }
  
    if (!this.selectedItem?.id) {
      const etat: any = {
        libelle: this.statusForm.value['libelle'],
        couleur: this.statusForm.value['couleur'],
      };
  
      this.managementService.saveEtatFonds(etat)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('', "État d'avancement ajouté avec succès !");
            this.loadData();
            this.openModal = false;
            this.resetForm();
          },
          error: () => {
            this.toastr.error("Erreur lors de l'ajout de l'état d'avancement !", 'Erreur');
          }
        });
    } else {
      this.updateStatus();
    }
  }
  
// Update status
  updateStatus() {
    if (
      this.statusForm.value['libelle'] === undefined ||
      this.statusForm.value['libelle'].trim() === ''
    ) {
      this.toastr.error('Le libellé ne peut pas être vide !');
      return;
    }
  
    const etat: any = {
      id: this.selectedItem.id,
      libelle: this.statusForm.value['libelle'],
      couleur: this.statusForm.value['couleur'],
    };
  
    this.managementService.updateEtatFonds(etat)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (etat: any) => {
          this.toastr.success('', "État d'avancement mis à jour avec succès !");
          this.loadData();
          this.openModal = false;
          this.resetForm();
        },
        error: () => {
          this.toastr.error("Erreur lors de la mise à jour de l'état d'avancement !", 'Erreur');
        }
      });
  }
  

  // Delete status
  deleteEtat(): void {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService.deleteEtatFonds(this.selectedItem?.id).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
        next: () => {
          this.toastr.success('', "État d'avancement supprimé avec succès!");
          this.loadData();
          this.clearSelection();
        },
        error: () => {
          this.toastr.error(
            "Il faut vérifier qu'aucun souscripteur n'utilise cet état d'avancement!",
            'Erreur de suppression!'
          );
        }
      });
    }
  }


  // Toggle show edit
  toggleShowEdit(item: any): void {
    this.editMode = true;
    this.selectedItem = item;
    this.statusForm.patchValue({
      libelle: item?.libelle,
      couleur: item?.couleur,
      couleur_assist: item?.couleur
    });
    this.openModal = true;
  }

  // Open the add modal 
  openAddModal(): void {
    this.resetForm();
    this.openModal = true;
  }

  // Reset the form 
  resetForm(): void {
    this.statusForm.reset();
    this.selectedItem = null;
    this.openModal = false;
  }

  // Clear selection
  clearSelection(): void {
    this.selectedItem = null;
  }
}