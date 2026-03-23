import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { marked } from 'marked';

@Component({
  selector: 'meeting-tracking',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule
  ],
  templateUrl: './meeting-tracking.component.html',
  styleUrl: './meeting-tracking.component.scss'
})
export class MeetingTrackingComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);

  projets: any[] | undefined;
  reunions: any | undefined;
  selectedProjet: any | undefined;
  years: number[] = [];
  loading = false;

  decisions: { [key: string]: any[] } = {};
  meetingsByYear: { [year: number]: any[] } = {};
  thisYear: number = new Date().getFullYear();

  documentTypes: string[] = ['PV Communiqué', 'PV Signé', 'PV Enregistré'];


  ngOnInit(): void {
    this.loadProjets();
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


  // Set the projet switch form value
  setProjet(p: any) {
    this.selectedProjet = p;
    sessionStorage.setItem('LastVisitedProject', p.id);
    this.loadMeetings();
  }

  // Load meetings
  loadMeetings() {
    this.meetingsByYear = {};

    this.managementService.findReunions(this.selectedProjet?.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.reunions = data;
        this.meetingsByYear = this.reunions.reduce(
          (acc: any, reunion: any) => {
            let year = new Date(reunion.dateReunion).getFullYear();
            if (!acc[year]) {
              acc[year] = [];
            }
            acc[year].push(reunion);
            return acc;
          },
          {}
        );
        this.years = Object.keys(this.meetingsByYear).map(Number);
        this.years.sort((a, b) => b - a);
        this.reunions.forEach((reunion: any) => {
          this.loadDecisionsResolutions(reunion.id);
        });
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Réunions non chargées!');
      },
      complete: () => {
        this.loading = false;
      }
    })
  }

  // Load decisions
  loadDecisionsResolutions(id: any) {
    this.managementService.findDecisions(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.decisions[id] = data;
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Décisions non chargées!');
      },
      complete: () => {
        this.loading = false;
      }
    })
  }

  // Get documents by type
  getDocumentsByType(reunion: any, typeLabel: string) {
    return reunion.documents.filter(
      (doc: any) => doc.type?.libelle == typeLabel
    );
  }

  // Go to fiche
  goToFiche() {
    this.router.navigateByUrl(
      '/dashboard/projects/' + this.selectedProjet?.id
    );
  }

  // Trim path
  trimPath(path: any) {
    try {
      path = (path as string);
      return path;
    } catch {
      return '';
    }
  }

  equals(a: any, b: any) {
    return a?.id == b?.id;
  }

  formatMD2HTML(libelle: string) {
    return marked.parse(libelle);
  }

}
