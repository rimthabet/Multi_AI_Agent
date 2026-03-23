import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { ProgressTimelineComponent } from './progress-timeline/progress-timeline.component';
import { TrackingProjectsXlsService } from '../../services/reports/tracking-projects-xls.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'projects',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    ProgressTimelineComponent,
    RouterLink  
  ],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent implements OnInit {

  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly trackingProjectsXlsService = inject(TrackingProjectsXlsService);

  projets: any | undefined;
  selectedItem: any | undefined;
  loading: boolean = false;


  ngOnInit(): void {
    this.loadProjects();
  }

  // Load projects
  loadProjects() {
    this.loading = true;
    this.managementService.findProjetsASuivre().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {

        data.sort((a: any, b: any) => a.nom >= b.nom);
        this.projets = data;
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Projets non chargés!');
      },
      complete: () => (this.loading = false),
    })
  }

  // Export the projects
  exportSuiviProjetToExcel() {
    this.trackingProjectsXlsService.exportToExcel(this.projets);
  }

}
