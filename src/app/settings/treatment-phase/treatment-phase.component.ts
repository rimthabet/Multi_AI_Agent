import {
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  inject,
  viewChild
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ClarityModule } from '@clr/angular';
import { CdsButtonModule, CdsDividerModule, CdsIconModule } from '@cds/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MultiPurposeDeleteDialogComponent } from '../../tools/multi-purpose-delete-dialog/multi-purpose-delete-dialog.component';
import { ManagementService } from '../../services/management.service';
import { environment } from '../../../environment/environment';

@Component({
  selector: 'treatment-phase',
  templateUrl: './treatment-phase.component.html',
  styleUrl: './treatment-phase.component.scss',
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
})
export class TreatmentPhaseComponent implements OnInit {

  //  Injects and ViewChild
  mp_delete_popup = viewChild.required<ElementRef>("mp_delete_popup");

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  public phaseForm!: FormGroup;

  delete_message: string =
    "Cette opération de suppression est considérée très dangereuse.\
     Elle va induire la suppression de toutes les autres données dépendantes. \
     En l'occurrence, tous les types des documents, les documents,\
      les conformités documentaires, les listes de contrôle et les fichiers sur disques dépendants seront tous supprimés.";

  phases: any[] = [];
  selectedItem: any = null;
  openModal = false;
  rest_url: string = environment.apiUrl + '/phases';
  loading = false;

  ngOnInit(): void {
    this.phaseForm = this.fb.group({
      libelle: ['', Validators.required],
      type: ['', Validators.required],
      rang: ['', Validators.required],
    });

    this.loadPhases();
  }

  // Load data 
  loadPhases(): void {
    this.loading = true;
    this.managementService.findPhases()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.phases = data.sort((p1: any, p2: any) => p1.rang > p2.rang);
        },
        error: (error: any) => {
          console.error('Error loading phases:', error);
          this.toastr.error('Erreur de chargement des phases!', 'Erreur');
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  // Save the phase 
  savePhase(): void {
    const phase = {
      libelle: this.phaseForm.value.libelle,
      typeValeur: this.phaseForm.value.type,
      rang: this.phaseForm.value.rang,
    };

    if (!this.selectedItem?.id) {
      this.managementService
        .savePhase(phase)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Phase ajoutée avec succès!');
            this.loadPhases();
            this.resetForm();
          },
          error: () => {
            this.toastr.error('Erreur de sauvegarde!', 'Phase non ajoutée!');
          },
        });
    } else {
      this.updatePhase();
    }
  }

  // Update the phase 
  updatePhase(): void {
    const updatedPhase = {
      id: this.selectedItem.id,
      libelle: this.phaseForm.value.libelle,
      typeValeur: this.phaseForm.value.type,
      rang: this.phaseForm.value.rang,
    };

    this.managementService
      .updatePhase(updatedPhase)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', 'Phase mise à jour avec succès!');
          this.loadPhases();
          this.resetForm();
        },
        error: () => {
          this.toastr.error('Erreur de sauvegarde!', 'Phase non mise à jour!');
        },
      });
  }

  // Delete the phase 
  deletePhase(): void {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService
        .deletePhase(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadPhases();
            this.toastr.success('', 'Phase supprimée avec succès!');
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

  // Select an item from the list 
  onSelectItem(item: any): void {
    this.selectedItem = item;
    this.phaseForm.patchValue({
      libelle: item.libelle,
      type: item.typeValeur,
      rang: item.rang,
    });
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
      this.phaseForm.patchValue({
        libelle: data.libelle,
        type: data.typeValeur,
        rang: data.rang,
      });
      this.openModal = true;
    } else {
      this.resetForm();
    }
  }

  // Reset the form 
  resetForm(): void {
    this.phaseForm.reset();
    this.selectedItem = null;
    this.openModal = false;
  }
}
