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
  selector: 'investment-type',
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
  templateUrl: './investment-type.component.html',
  styleUrl: './investment-type.component.scss'
})
export class InvestmentTypeComponent implements OnInit {

  //  Injects and ViewChild
  mp_delete_popup = viewChild.required<ElementRef>("mp_delete_popup");
  rest_url: string = environment.apiUrl + '/type-investissement';

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  public investmentTypeForm!: FormGroup;

  loading: boolean = false;
  types: any[] = [];
  selectedItem: any = null;
  openModal: boolean = false;
  delete_message: string =
    "Cette opération de suppression est considérée très dangereuse. Elle \
            va induire la suppression de tous les projets ayant ce type d'investissement.";

  ngOnInit(): void {
    this.investmentTypeForm = this.fb.group({
      libelle: ['', [Validators.required]],
    });

    this.loadInvestmentTypes();
  }

  // Load data 
  loadInvestmentTypes(): void {
    this.loading = true;
    this.managementService.findTypeInvestissement()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.types = data;
          this.loading = false;
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Types d\'investissement non chargés!');
          this.loading = false;
        }
      });
  }

  // Save the investment type
  saveInvestmentType(): void {
    if (!this.selectedItem?.id) {
      let investmentType: any = {
        libelle: this.investmentTypeForm.value.libelle,
      };

      this.managementService.saveTypeInvestissement(investmentType)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Type d\'investissement Ajouté avec Succès!');
            this.loadInvestmentTypes();
            this.resetForm();
          },
          error: () => {
            this.toastr.error('Erreur de sauvegarde!', 'Type d\'investissement non ajouté!');
          }
        });
    } else {
      this.updateInvestmentType();
    }
  }

  // Update the investment type
  updateInvestmentType(): void {
    let investmentType: any = {
      id: this.selectedItem.id,
      libelle: this.investmentTypeForm.value.libelle,
    };

    this.managementService.updateTypeInvestissement(investmentType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', 'Type d\'investissement mise à jour avec succès!');
          this.loadInvestmentTypes();
          this.resetForm();
        },
        error: () => {
          this.toastr.error('Erreur lors de la mise à jour du type d\'investissement !', 'Erreur');
        }
      });
  }

  // Delete the investment type
  deleteInvestmentType(): void {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService.deleteTypeInvestissement(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Type d\'investissement supprimé avec succès!');
            this.loadInvestmentTypes();
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
      this.investmentTypeForm.patchValue({ libelle: data.libelle });
      this.openModal = true;
    } else {
      this.resetForm();
    }
  }

  // Reset the form
  resetForm() {
    this.investmentTypeForm.reset();
    this.selectedItem = undefined;
    this.openModal = false;
  }

}
