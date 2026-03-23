import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ManagementService } from '../../services/management.service';
import { StatutoryAuditorFormComponent } from "../statutory-auditor-form/statutory-auditor-form.component";

@Component({
  selector: 'project-auditor',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    StatutoryAuditorFormComponent
],
  templateUrl: './project-auditor.component.html',
  styleUrl: './project-auditor.component.scss'
})
export class ProjectAuditorComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  public projectAuditorForm!: FormGroup;

  loading: boolean = false;
  projectAuditors: any[] = [];
  selectedItem: any = null;
  openModal: boolean = false;

  ngOnInit(): void {
    this.projectAuditorForm = this.fb.group({
      libelle: ['', [Validators.required]],
      cabinet: ['', [Validators.required]],
    });

    this.loadProjectAuditors();
  }

  // Load project auditors data
  loadProjectAuditors(): void {
    this.loading = true;
    this.managementService.findCommissairesProjet()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.projectAuditors = data;
          this.loading = false;
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Commissaires aux comptes non chargés!');
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

  // Save the project auditor
  saveProjectAuditor(): void {
    if (!this.selectedItem?.id) {
      let auditor: any = {
        libelle: this.projectAuditorForm.value.libelle,
        cabinet: this.projectAuditorForm.value.cabinet,
      };

      this.managementService.saveCommissaireProjet(auditor)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Commissaire ajouté avec succès!');
            this.loadProjectAuditors();
            this.resetForm();
          },
          error: () => {
            this.toastr.error('', 'Ajout de commissaire échoué !');
          }
        });
    } else {
      //this.updateProjectAuditor();
    }
  }

  // Delete the project auditor
  deleteProjectAuditor(): void {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService.deleteCommissaireProjet(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Commissaire supprimé avec succès!');
            this.loadProjectAuditors();
            this.resetForm();
          },
          error: () => {
            this.toastr.error(
              "Il faut vérifier qu'aucun projet n'utilise ce commissaire!",
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
      this.projectAuditorForm.patchValue({ libelle: data.libelle });
      this.openModal = true;
    } else {
      this.resetForm();
    }
  }

  // Reset the form
  resetForm() {
    this.projectAuditorForm.reset();
    this.selectedItem = undefined;
    this.openModal = false;
  }
}