import { Component, OnInit, OnDestroy, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormGroup, Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { CdsButtonModule, CdsDividerModule, CdsIconModule } from '@cds/angular';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ManagementService } from '../../services/management.service';

@Component({
  selector: 'document-compliance',
  imports: [ClarityModule, CdsButtonModule, CdsIconModule, CdsDividerModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './document-compliance.component.html',
  styleUrl: './document-compliance.component.scss'
})
export class DocumentComplianceComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);

  public documentComplianceForm!: FormGroup<any>;

  editMode: boolean = false;
  opened: boolean = false;
  loading: boolean = false;
  typesDocuments: any[] | undefined;
  phases: any[] = [];
  taches: any[] = [];

  conformites: any[] = [];
  filtered_conformites: any[] = [];

  selectedConformite: any = [];
  phase_filter_data: any[] = [];
  task_filter_data: any[] = [];

  filter: any = { type: undefined, phase: undefined, task: undefined };

  ngOnInit(): void {

    this.documentComplianceForm = this.formBuilder.group({
      type: [undefined, [Validators.required]],
      qualification: [undefined, [Validators.required]],
      type_document: [undefined, [Validators.required]],
      phase: [undefined, [Validators.required]],
      tache: [undefined, [Validators.required]],
    });

    this.loadPhases();
    this.loadTasks();
    this.loadTypesDocuments();
    this.loadDocumentCompliances();
  }



  // Load phases
  loadPhases(): void {
    this.managementService.findPhases().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: (data: any) => {
          this.phases = data;
          this.phase_filter_data = data;
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Phases non chargées!');
        }
      }
    )
  }


  // Load tasks
  loadTasks(): void {
    this.managementService.findTache().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: (data: any) => {
          this.taches = data;
          this.task_filter_data = data;
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Tâches non chargées!');
        }
      }
    )
  }


  // Load types documents
  loadTypesDocuments(): void {
    this.managementService.findDocumentTypes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: (data: any) => {
          this.typesDocuments = data;
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Types de documents non chargés!');
        }
      }
    )
  }

  // Load data
  loadDocumentCompliances() {
    this.loading = true;
    this.managementService.findConformites().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: (data: any) => {
          this.conformites = data;
          this.filterData();
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Conformités non chargées!');
        },
        complete: () => {
          this.loading = false;
        }
      }
    );
  }

  // Hide modal
  hideConformiteModal() {
    this.opened = false;
    this.documentComplianceForm.reset();
  }

  // We call save systimatically and we switch internally
  saveConformite() {
    if (!this.selectedConformite) {
      let conformite: any = {
        type: this.documentComplianceForm?.value['type'],
        qualification: this.documentComplianceForm?.value['qualification'],
        documentType: this.documentComplianceForm?.value['type_document'],
        phase: this.documentComplianceForm?.value['phase'],
        tache: this.documentComplianceForm?.value['tache'],
      };

      this.managementService.saveConformite(conformite).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.toastr.success(
            '',
            'Conformitée documentaire ajoutée avec succès!'
          );
          this.loadDocumentCompliances();
          this.showEdit();
        },
        complete: () => {
          this.documentComplianceForm.reset();
          this.opened = false;
        },
      });
    } else {
      this.updateConformite();
    }
  }

  // Update conformite
  updateConformite() {
    let conformite: any = {
      id: this.selectedConformite.id,
      type: this.documentComplianceForm?.value['type'],
      qualification: this.documentComplianceForm?.value['qualification'],
      documentType: this.documentComplianceForm?.value['type_document'],
      phase: this.documentComplianceForm?.value['phase'],
      tache: this.documentComplianceForm?.value['tache'],
    };

    this.managementService.updateConformites(conformite).subscribe({
      next: (data: any) => {
        this.toastr.success(
          '',
          'Conformité documentaire modifiée avec succès!'
        );

        this.loadDocumentCompliances();
        this.showEdit();
      },
      complete: () => {
        this.documentComplianceForm.reset();
        this.opened = false;
      },
    });
  }

  // Delete conformite
  deleteConformite() {
    if (
      confirm(
        'Veuillez confirmer la suppression de cette conformité docuementaire ?'
      )
    ) {
      if (this.selectedConformite.id) {
        this.managementService
          .deleteConformite(this.selectedConformite.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((data: any) => {
            this.toastr.success(
              '',
              'Conformité documentaire supprimée avec succès !'
            );
            this.loadDocumentCompliances();
          })
      }
    }
  }

  // Show edit modal
  showEdit() {
    if (this.selectedConformite) {
      this.documentComplianceForm.patchValue({
        id: this.selectedConformite.id,
        type: this.selectedConformite.type == 'FONDS' ? 0 : 1,
        qualification:
          this.selectedConformite.qualification == 'OBLIGATOIRE' ? 1 : 0,
        type_document: this.selectedConformite.documentType,
        phase: this.selectedConformite.phase,
        tache: this.selectedConformite.tache,
      });
      this.opened = true;
    } else {
      this.opened = false;
    }
  }
  /////////////// Filtering routines

  selectType(type: any) {
    this.filter = { type: undefined, phase: undefined, task: undefined };
    this.filter.type = type;
    this.phase_filter_data = this.phases?.filter(
      (phase: any) => phase.type == type
    );
    this.filterData();
  }
  clearType() {
    this.phase_filter_data = [...this.phases];
    this.filter = { type: undefined, phase: undefined, task: undefined };
    this.filterData();
  }

  selectPhase(phase: any) {
    this.filter.phase = phase;
    this.task_filter_data = this.taches?.filter(
      (task: any) => task.phase.id == phase.id
    );
    this.filterData();
  }

  clearPhase() {
    this.task_filter_data = [...this.taches];
    this.filter.phase = undefined;
    this.filterData();
  }

  selectTask(task: any) {
    this.filter.task = task;
    this.filterData();
  }
  clearTask() {
    this.filter.task = undefined;
    this.filterData();
  }

  filterData() {
    let data = this.conformites;
    this.filtered_conformites = [...data];

    if (this.filter.type) {
      this.filtered_conformites = data.filter(
        (c: any) => c.type.toLowerCase() == this.filter.type.toLowerCase()
      );
      data = [...this.filtered_conformites];
    }

    if (this.filter.phase) {
      this.filtered_conformites = data.filter(
        (c: any) => c.phase.id == this.filter.phase.id
      );
      data = [...this.filtered_conformites];
    }

    if (this.filter.task) {
      this.filtered_conformites = data.filter(
        (c: any) => c.tache.id == this.filter.task.id
      );
    }
  }

  equals(a: any, b: any) {
    return a?.id == b?.id;
  }

}


