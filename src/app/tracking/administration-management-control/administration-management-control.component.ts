import { Component, DestroyRef, inject, OnInit, viewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../services/management.service';
import { CommonModule } from '@angular/common';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { GeneralDirectorFormComponent } from './general-director-form/general-director-form.component';
import { StatutoryAuditorsFormComponent } from './statutory-auditors-form/statutory-auditors-form.component';
import { ProjectAdministratorsFormComponent } from './project-administrators-form/project-administrators-form.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

@Component({
  selector: 'administration-management-control',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    GeneralDirectorFormComponent,
    StatutoryAuditorsFormComponent,
    ProjectAdministratorsFormComponent
  ],
  templateUrl: './administration-management-control.component.html',
  styleUrl: './administration-management-control.component.scss'
})
export class AdministrationManagementControlComponent implements OnInit {

  directeurForm = viewChild<GeneralDirectorFormComponent>("general-director-form");
  commissaireForm = viewChild<StatutoryAuditorsFormComponent>("commissaire_form");
  administrateurForm = viewChild<ProjectAdministratorsFormComponent>("administrateur_form");

  private readonly destroyRef = inject(DestroyRef);
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);

  projets: any[] = [];
  selectedProjet: any | undefined;
  isPanelOpen = true;
  loading: boolean = false;


  ngOnInit(): void {

    // Load the projects
    this.loadProjets();
  }

  // Set the projet switch form value
  setProjet(p: any) {
    this.selectedProjet = p;
    sessionStorage.setItem('LastVisitedProject', p.id);
  }

  // Load the projects
  loadProjets() {

    this.loading = true;
    this.managementService.findProjets(5).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.projets = data;
        let lastSelectedProject = sessionStorage.getItem('LastVisitedProject');
        if (lastSelectedProject) {
          lastSelectedProject = this.projets?.filter(
            (p: any) => lastSelectedProject == p.id
          )[0];
          this.setProjet(lastSelectedProject);
        } else this.setProjet(data[0]);

        this.projets?.sort((a: any, b: any) => {
          if (a.nom > b.nom) return 1;
          if (a.nom < b.nom) return -1;
          return 0;
        });
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Projets non chargés!');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  // Go to the project fiche
  goToFiche() {
    this.router.navigateByUrl(
      '/dashboard/projects/' + this.selectedProjet?.id
    );
  }

  // Equals function
  equals(a: any, b: any) {
    return a?.id == b?.id;
  }


}
