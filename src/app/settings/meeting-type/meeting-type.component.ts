import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
 import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ManagementService } from '../../services/management.service';

@Component({
  selector: 'meeting-type',
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
  templateUrl: './meeting-type.component.html',
  styleUrl: './meeting-type.component.scss'
})
export class MeetingTypeComponent implements OnInit{
 

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  public meetingTypeForm!: FormGroup;

  loading: boolean = false;
  meetingTypes: any[] = [];
  selectedItem: any = null;
  openModal: boolean = false;
   

  ngOnInit(): void {
    this.meetingTypeForm = this.fb.group({
      libelle: ['', [Validators.required]],
    });

    this.loadMeetingTypes();
  }

  // Load data 
  loadMeetingTypes(): void {
    this.loading = true;
    this.managementService.findTypesReunion()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.meetingTypes = data;
          this.loading = false;
        },
        error: () => {
          this.toastr.error('Erreur lors du chargement des types de réunions !', 'Erreur');
          this.loading = false;
        }
      });
  }

  // Save the meeting type
  saveMeetingType(): void {
    if (!this.selectedItem?.id) {
      let meetingType: any = {
        libelle: this.meetingTypeForm.value.libelle,
      };

      this.managementService.saveTypesReunion(meetingType)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Type de réunion ajouté avec Succès!');
            this.loadMeetingTypes();
            this.resetForm();
          },
          error: () => {
            this.toastr.error('Erreur de sauvegarde!', 'Type de réunion non ajouté!');
          }
        });
    } else {
      this.updateMeetingType();
    }
  } 

  
  // Update the meeting type
  updateMeetingType(): void {
    let meetingType: any = {
      id: this.selectedItem.id,
      libelle: this.meetingTypeForm.value.libelle,
    };

    this.managementService.updateTypesReunion(meetingType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', 'Type de réunion mis à jour avec succès!');
          this.loadMeetingTypes();
          this.resetForm();
        },
        error: () => {
          this.toastr.error('Erreur lors de la mise à jour du type de réunion !', 'Erreur');
        }
      });
  }

  // Delete the meeting type
  deleteMeetingType(): void {
    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService.deleteTypesReunion(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Type de réunion supprimé avec succès!');
            this.loadMeetingTypes();
            this.resetForm();
          },
          error: () => {
            this.toastr.error(
              "Il faut vérifier qu'aucun projet ni fonds n'utilise ce type de réunion!",
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
      this.meetingTypeForm.patchValue({ libelle: data.libelle });
      this.openModal = true;
    } else {
      this.resetForm();
    }
  }

  // Reset the form
  resetForm() {
    this.meetingTypeForm.reset();
    this.selectedItem = undefined;
    this.openModal = false;
  }

}
