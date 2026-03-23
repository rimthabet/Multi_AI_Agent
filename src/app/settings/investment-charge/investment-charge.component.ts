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
  selector: 'investment-charge',
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
  templateUrl: './investment-charge.component.html',
  styleUrl: './investment-charge.component.scss'
})
export class InvestmentChargeComponent implements OnInit {

  //  Injects and ViewChild
  mp_delete_popup = viewChild.required<ElementRef>("mp_delete_popup");
  rest_url: string = environment.apiUrl + '/charge-investissement';

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  public investmentChargeForm!: FormGroup;

  loading: boolean = false;
  charges: any[] = [];
  selectedItem: any = null;
  openModal: boolean = false;
  delete_message: string =
    "Cette opération de suppression est considérée très dangereuse. Elle \
            va induire la suppression de tous les projets ayant ce type d'investissement.";

  ngOnInit(): void {
    this.investmentChargeForm = this.fb.group({
      nom: ['', [Validators.required]],
    });

    this.loadInvestmentCharges();
  }

  // Load data 
  loadInvestmentCharges(): void {
    this.loading = true;
    this.managementService.findChargeInvestissement()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.charges = data;
          this.loading = false;
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Types d\'investissement non chargés!');
          this.loading = false;
        }
      });
  }

    // Save the investment charge
    saveInvestmentCharge(): void {
      if (!this.selectedItem?.id) {
        let investmentCharge: any = {
          nom: this.investmentChargeForm.value.nom,
        };

        this.managementService.saveChargeInvestissement(investmentCharge)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.toastr.success('', 'Type d\'investissement Ajouté avec Succès!');
              this.loadInvestmentCharges();
              this.resetForm();
            },
            error: () => {
              this.toastr.error('Erreur de sauvegarde!', 'Type d\'investissement non ajouté!');
            }
          });
      } else {
        this.updateInvestmentCharge();
      }
    }

updateInvestmentCharge(): void {
  let investmentCharge: any = {
    id: this.selectedItem.id,
    nom: this.investmentChargeForm.value.nom,
  };

  this.managementService.updateChargeInvestissement(investmentCharge)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: () => {
        this.toastr.success('', 'Type d\'investissement mise à jour avec succès!');
        this.loadInvestmentCharges();
        this.resetForm();
      },
      error: () => {
        this.toastr.error('Erreur lors de la mise à jour du type d\'investissement !', 'Erreur');
      }
    });
}

// Delete the investment charge
deleteInvestmentCharge(): void {
  if (confirm('Veuillez confirmer cette suppression !')) {
    this.managementService.deleteChargeInvestissement(this.selectedItem.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', 'Type d\'investissement supprimé avec succès!');
          this.loadInvestmentCharges();
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
    this.investmentChargeForm.patchValue({ nom: data.nom });
    this.openModal = true;
  } else {
    this.resetForm();
  }
}

// Reset the form
resetForm() {
  this.investmentChargeForm.reset();
  this.selectedItem = undefined;
  this.openModal = false;
}

}
