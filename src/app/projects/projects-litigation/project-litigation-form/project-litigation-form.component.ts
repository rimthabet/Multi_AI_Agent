import { Component, DestroyRef, inject, input, model } from '@angular/core';
import { ClrModalModule, ClrDatepickerModule, ClrInputModule, ClrSelectModule } from '@clr/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ManagementService } from '../../../services/management.service';
import { LitigationService } from '../../../services/litigation.service';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CdsDividerModule } from "@cds/angular";
import { formatDate } from '@angular/common';
import { firstValueFrom, Subject } from 'rxjs';

const lmsUser = {
  nom: 'PAMS Admin',
  email: 'pams.admin@pams.com',
  role: 'ADMIN'
};

@Component({
  selector: 'project-litigation-form',
  imports: [ClrModalModule, ClrDatepickerModule, ClrInputModule, ClrSelectModule, ReactiveFormsModule, CdsDividerModule],
  templateUrl: './project-litigation-form.component.html',
  styleUrl: './project-litigation-form.component.scss'
})
export class ProjectLitigationFormComponent {

  // IN OUT 
  open = model<boolean>(false);

  // Input
  project = input<any>();

  // Services
  private readonly litigationService = inject(LitigationService);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  // State
  caseSaveForm!: FormGroup;
  dossier: any | undefined = null;

  typeContentieuxOptions: any[] = [];
  entitiesTypes: any[] = [];

  loading: boolean = false;

  // INITIALIZE
  ngOnInit(): void {

    this.caseSaveForm = this.fb.group({
      titre: [undefined, Validators.required],
      typeContentieux: [undefined, Validators.required],
      typeEntite: [undefined, Validators.required],
      numeroDossier: [undefined, Validators.required],
      dateCreation: [formatDate(new Date(), "dd/MM/yyyy", "fr-FR"), Validators.required],
    });

    this.loadTypeContentieuxOptions();
    this.loadTypeEntites();
  }

  // Load type contentieux options
  loadTypeContentieuxOptions() {
    this.loading = true;
    this.litigationService.getTypeContentieuxOptions().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.typeContentieuxOptions = data;
      },
      error: (error) => {
        console.error('Error loading type contentieux options:', error);
      },
      complete: () => (this.loading = false)
    });
  }

  // Load type entites
  loadTypeEntites(): void {
    this.loading = true;
    this.litigationService.findTypeEntites()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (typeEntites: any) => {
          this.entitiesTypes = typeEntites;
        },
        error: (error) => {
          console.error('Error loading type entites:', error);
        },
        complete: () => (this.loading = false)
      });
  }



  // Save dossier
  async saveLitigationCase(): Promise<void> {

    this.loading = true;
    // Preparing the case to be created
    const [d, m, y] = this.caseSaveForm.value.dateCreation.split('/');

    this.dossier = {
      titre: this.caseSaveForm.value.titre,
      typeContentieux: this.caseSaveForm.value.typeContentieux,
      numeroDossier: this.caseSaveForm.value.numeroDossier,
      dateCreation: new Date(y, m - 1, d),

      entite: {
        nom: this.project()?.projet?.nom,
        type: this.caseSaveForm.value.typeEntite,
        statutJuridique: this.project()?.projet?.formeJuridique,
      },

      creePar: lmsUser
    };


    // Create a subject to signal when the subscription is complete
    const done$ = new Subject<boolean>();

    // save dossier
    this.litigationService.saveDossier(this.dossier)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.toastr.success('', 'Dossier ajouté avec succès au niveau LMS!');

          this.dossier = data
          done$.next(true);
          done$.complete();
        },
        error: (err: any) => {

          console.error('Error saving dossier:', err);
          this.toastr.error('Erreur lors de la création du dossier au niveau LMS!', 'Erreur');

          done$.next(false);
          done$.complete();
        },
        complete: () => {
          done$.complete();
          this.loading = false;
        }

      });

    // Wait for the creation of the case (dossier)
    await firstValueFrom(done$);

    // If the dossier is created successfully
    if (this.dossier?.id) {
      this.loading = true;
      const contentieux = {
        libelle: this.caseSaveForm.value.titre,
        projet: { id: this.project()?.projet?.id },
        dossierId: this.dossier.id,
        observation: "Dossier créé directement sur PAMS",
      };

      // Create a case in the PAMS space
      this.managementService.saveContentieux(contentieux)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('', 'Contentieux ajouté avec succès au niveau PAMS!');
          },
          error: (err: any) => {
            console.error('Error saving contentieux:', err);
            this.toastr.error('', 'Erreur lors de l\'ajout du contentieux au niveau PAMS!');
          },
          complete: () => {
            this.loading = false;
          }
        });
    }
  }

}
