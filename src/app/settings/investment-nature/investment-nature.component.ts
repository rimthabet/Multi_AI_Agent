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
  selector: 'investment-nature',
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
  templateUrl: './investment-nature.component.html',
  styleUrl: './investment-nature.component.scss'
})
export class InvestmentNatureComponent implements OnInit {

  //  Injects and ViewChild
  mp_delete_popup = viewChild.required<ElementRef>("mp_delete_popup");
  rest_url: string = environment.apiUrl + '/natureInvestissement';

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  public investmentNatureForm!: FormGroup;

  loading: boolean = false;
  natures: any[] = [];
  selectedItem: any = null;
  openModal: boolean = false;
  delete_message: string =
    "Cette opération de suppression est considérée très dangereuse. Elle \
            va induire la suppression de tous les projets ayant ce type d'investissement.";

  ngOnInit(): void {
    this.investmentNatureForm = this.fb.group({
      libelle: ['', [Validators.required]],
    });

    this.loadInvestmentNatures();
  }

  // Load data 
  loadInvestmentNatures(): void {
    this.loading = true;
    this.managementService.findNatureInvestissement()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.natures = data;
          this.loading = false;
        },
        error: () => {
          this.toastr.error('Erreur lors du chargement des natures d\'investissement !', 'Erreur');
          this.loading = false;
        }
      });
  }

  // Save the investment nature
  saveInvestmentNature(): void {
    if (!this.selectedItem?.id) {
      let investmentNature: any = {
        libelle: this.investmentNatureForm.value.libelle,
      };

      this.managementService.saveNatureInvestissement(investmentNature)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Nature d\'investissement Ajoutée avec Succès!');
            this.loadInvestmentNatures();
            this.resetForm();
          },
          error: () => {
            this.toastr.error('Erreur de sauvegarde!', 'Nature d\'investissement non ajoutée!');
          }
        });
    } else {
      this.updateInvestmentNature();
    }
  }

  // Update the investment nature
  updateInvestmentNature(): void {
    let investmentNature: any = {
      id: this.selectedItem.id,
      libelle: this.investmentNatureForm.value.libelle,
    };

    this.managementService.updateNatureInvestissement(investmentNature)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', 'Nature d\'investissement mise à jour avec succès!');
          this.loadInvestmentNatures();
          this.resetForm();
        },
        error: () => {
          this.toastr.error('Erreur lors de la mise à jour de la nature d\'investissement !', 'Erreur');
        }
      });
  }

  // Delete the investment nature
  deleteInvestmentNature(): void {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService.deleteNatureInvestissement(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Nature d\'investissement supprimée avec succès!');
            this.loadInvestmentNatures();
            this.resetForm();
          },
          error: () => {
            this.toastr.error(
              "Il faut vérifier qu'aucun projet n'utilise ce type d'investissement!",
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
      this.investmentNatureForm.patchValue({ libelle: data.libelle });
      this.openModal = true;
    } else {
      this.resetForm();
    }
  }

  // Reset the form
  resetForm() {
    this.investmentNatureForm.reset();
    this.selectedItem = undefined;
    this.openModal = false;
  }

}
