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
  selector: 'investment-framework',
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
  templateUrl: './investment-industry.component.html',
  styleUrl: './investment-industry.component.scss'
})
export class InvestmentIndustryComponent implements OnInit {

  //  Injects and ViewChild
  mp_delete_popup = viewChild.required<ElementRef>("mp_delete_popup");
  rest_url: string = environment.apiUrl + '/cadre-investissement';

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  public frameworkForm!: FormGroup;

  loading: boolean = false;
  frameworks: any[] = [];
  selectedItem: any = null;
  openModal: boolean = false;
  delete_message: string =
    "Cette opération de suppression est considérée très dangereuse. Elle \
            va induire la suppression de tous les fonds d'investissement défiscalisés, leurs souscriptions et les libérations correspondates, et tous les documents dépendants, seront tous \
            supprimeés.";

  ngOnInit(): void {
    this.frameworkForm = this.fb.group({
      libelle: ['', [Validators.required]],
    });

    this.loadFrameworks();
  }

  // Load frameworks
  loadFrameworks(): void {
    this.loading = true;
    this.managementService.findCadreInvestissement().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.frameworks = data;
        this.loading = false;
      },
      error: () => {
        this.toastr.error('Erreur lors du chargement des cadres !', 'Erreur');
        this.loading = false;
      }
    });
  }

  // Save framework
  saveFramework(): void {
    if (!this.selectedItem?.id) {
      let framework: any = {
        libelle: this.frameworkForm.value.libelle,
      };

      this.managementService.saveCadreInvestissement(framework)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Cadre d\'investissement Ajouté avec Succès!');
            this.loadFrameworks();
            this.resetForm();
          },
          error: () => {
            this.toastr.error('Erreur de sauvegarde!', 'Cadre d\'investissement non ajouté!');
          }
        });
    } else {
      this.updateFramework();
    }
  }

  // Update framework
  updateFramework(): void {
    let framework: any = {
      id: this.selectedItem.id,
      libelle: this.frameworkForm.value.libelle,
    };

    this.managementService.updateCadreInvestissement(framework)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', 'Cadre d\'investissement mis à jour avec succès!');
          this.loadFrameworks();
          this.resetForm();
        },
        error: () => {
          this.toastr.error('Erreur lors de la mise à jour du cadre d\'investissement !', 'Erreur');
        }
      });
  }

  // Delete framework
  deleteFramework(): void {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService.deleteCadreInvestissement(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Cadre d\'investissement supprimé avec succès!');
            this.loadFrameworks();
            this.resetForm();
          },
          error: () => {
            this.toastr.error(
              "Il faut vérifier qu'aucun fond d'investissement n'utilise ce cadre d'investissement!",
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
      this.frameworkForm.patchValue({ libelle: data.libelle });
      this.openModal = true;
    } else {
      this.resetForm();
    }
  }

  // Reset the form
  resetForm() {
    this.frameworkForm.reset();
    this.selectedItem = undefined;
    this.openModal = false;
  }

}

