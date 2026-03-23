import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-projects-under-study',
  imports: [ClarityModule, CdsModule, DecimalPipe, RouterLink],
  templateUrl: './projects-under-study.component.html',
  styleUrl: './projects-under-study.component.scss'
})
export class ProjectsUnderStudyComponent implements OnInit {

  // --- DEPENDENCY INJECTION ---
  private readonly destroyRef = inject(DestroyRef);

  // Service for API calls and data management
  private readonly managementService = inject(ManagementService);


  projets: Array<{ id: number; nom: string; email: string; activite: string; observation: string; telephone: string, secteur: any, projet: any, financement: any, promoteur: any, natureInvestissement: any, capitalSocial: number }> = [];


  // Indicates if data is being loaded
  loading = true;


  // Lifecycle hook - Component initialization
  ngOnInit(): void {
    // Load projects
    this.loadProjects();
  }


  /**
   * Loads the list of projects from the API
   * Sorts projects alphabetically by name
   */
  loadProjects(): void {
    // Set loading state
    this.loading = true;

    // Fetch projects from the management service
    this.managementService.findProjetWithFinancement().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data: any) => {

        // Sort projects alphabetically by name
        data?.sort((a: any, b: any) => a.projet?.nom?.localeCompare(b.projet?.nom));

        // Filter projects by state
        this.projets = data?.filter(
          (projet: any) =>
            projet.projet?.etatAvancement?.libelle === 'En étude'
        );
      },
      complete: () => {

        // Set loading state
        this.loading = false;
      },
    })

  }
}
