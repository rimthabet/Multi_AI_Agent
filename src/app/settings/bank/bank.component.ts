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
  selector: 'bank',
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
  templateUrl: './bank.component.html',
  styleUrl: './bank.component.scss'
})
export class BankComponent implements OnInit {

  //  Injects and ViewChild
  mp_delete_popup = viewChild.required<ElementRef>("mp_delete_popup");
  rest_url: string = environment.apiUrl + '/banques';

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  public bankForm!: FormGroup;

  loading: boolean = false;
  banks: any[] = [];
  selectedItem: any = null;
  openModal: boolean = false;
  delete_message: string = "Cette opération de suppression est considérée très dangereuse. Elle \
            va induire la suppression de tous les fonds d'investissement ayant cette banque dépositaire.";


  ngOnInit(): void {
    this.bankForm = this.fb.group({
      libelle: ['', [Validators.required]],
    });

    this.loadBanks();
  }

  // Load data 
  loadBanks(): void {
    this.loading = true;
    this.managementService.findBanque()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.banks = data;
          this.loading = false;
        },
        error: () => {
          this.toastr.error('Erreur lors du chargement des banques !', 'Erreur');
          this.loading = false;
        }
      });
  }

  // Save the bank
  saveBank(): void {
    if (!this.selectedItem?.id) {
      let bank: any = {
        libelle: this.bankForm.value.libelle,
      };

      this.managementService.saveBanque(bank)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Banque Ajoutée avec Succès!');
            this.loadBanks();
            this.resetForm();
          },
          error: () => {
            this.toastr.error('Erreur de sauvegarde!', 'Banque non ajoutée!');
          }
        });
    } else {
      this.updateBank();
    }
  }

  // Update the bank
  updateBank(): void {
    let bank: any = {
      id: this.selectedItem.id,
      libelle: this.bankForm.value.libelle,
    };

    this.managementService.updateBanque(bank)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', 'Banque mise à jour avec succès!');
          this.loadBanks();
          this.resetForm();
        },
        error: () => {
          this.toastr.error('Erreur lors de la mise à jour de la banque !', 'Erreur');
        }
      });
  }

  // Delete the bank
  deleteBank(): void {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService.deleteBanque(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Banque supprimée avec succès!');
            this.loadBanks();
            this.resetForm();
          },
          error: () => {
            this.toastr.error(
              "Il faut vérifier qu'aucun fond d'investissement n'utilise cette banque dépositaire!",
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
      this.bankForm.patchValue({ libelle: data.libelle });
      this.openModal = true;
    } else {
      this.resetForm();
    }
  }

  // Reset the form
  resetForm() {
    this.bankForm.reset();
    this.selectedItem = undefined;
    this.openModal = false;
  }

}
