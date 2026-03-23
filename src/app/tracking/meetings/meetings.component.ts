import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, viewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, } from '@angular/forms';
import { Router } from '@angular/router';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ManagementService } from '../../services/management.service';
import { MeetingGridComponent } from './meeting-grid/meeting-grid.component';
import { MeetingFormComponent } from './meeting-form/meeting-form.component';

@Component({
  selector: 'meetings',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    MeetingGridComponent,
    MeetingFormComponent
  ],
  templateUrl: './meetings.component.html',
  styleUrl: './meetings.component.scss'
})
export class MeetingsComponent implements OnInit {

  reunion_grid = viewChild<MeetingGridComponent>("reunion_grid");

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);

  projets: any[] | undefined;
  reunions: any | undefined;

  membres: { [key: string]: any[] } = {};
  decisions: { [key: string]: any[] } = {};
  meetingsByYear: { [year: number]: any[] } = {};

  years: number[] = [];
  thisYear: number = new Date().getFullYear();

  selectedProjet: any | undefined;

  loading = false;
  formOpened = false;

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
  setProjet(p: any): void {
    this.selectedProjet = p;
    sessionStorage.setItem('LastVisitedProject', p.id);

    // Update the child component
    this.reunion_grid()?.setProjet(p);

    // Load meetings for this project
    this.loadMeetings();
  }


  // Load meetings
  loadMeetings(): void {
    if (!this.selectedProjet?.id) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.managementService.findReunions(this.selectedProjet.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.reunions = data.sort((a: any, b: any) => {
          if (a.dateReunion > b.dateReunion) return 1;
          if (a.dateReunion < b.dateReunion) return -1;
          return 0;
        });

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
          this.loadMembres(reunion.id);
          this.loadDecisionsResolutions(reunion.id);
        });
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Réunions non chargées!');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  // Load membres
  loadMembres(id: any): void {
    this.managementService.findMembres(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.membres[id] = data;
      },
    });
  }

  // Load decisions
  loadDecisionsResolutions(id: any): void {
    this.managementService.findDecisions(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.decisions[id] = data;
      },
    });
  }

  // Meeting deleted
  meetingDeleted(): void {
    this.loadMeetings();
  }

  // Meeting saved
  meetingSaved(newReunion: any): void {
    this.reunions.push(newReunion);
    // Ajouter la réunion à l'année correspondante
    let year = new Date(newReunion.dateReunion).getFullYear();
    if (!this.meetingsByYear[year]) this.meetingsByYear[year] = [];
    this.meetingsByYear[year].push(newReunion);
    if (!this.years.includes(year)) {
      this.years.push(year);
      this.years.sort((a, b) => b - a);
    }
  }

  // Get meetings by year
  getMeetingsByYear(year: number): any[] {
    return this.reunions.filter(
      (reunion: any) => new Date(reunion.dateReunion).getFullYear() == year
    );
  }

  // Adds a meeting, class by year, and updates the list of years sorted in descending order
  handleMeetingSaved(reunion: any): void {
    this.reunions.push(reunion);
    let year = new Date(reunion.dateReunion).getFullYear();
    if (!this.meetingsByYear[year]) {
      this.meetingsByYear[year] = [];
    }
    this.meetingsByYear[year].push(reunion);
    if (!this.years.includes(year)) {
      this.years.push(year);
      this.years.sort((a, b) => b - a);
    }
    this.formOpened = false;
  }

  // Refresh meeting
  refreshMeeting(reunion: any): void {
    let oldYear = new Date(
      this.reunions.find((r: any) => r.id == reunion.id)?.dateReunion
    ).getFullYear();
    let newYear = new Date(reunion.dateReunion).getFullYear();

    // Update the meeting in the main list
    this.reunions = this.reunions.map((r: any) =>
      r.id == reunion.id ? reunion : r
    );

    // Update the specific years
    if (oldYear != newYear) {
      // Remove from the old year
      this.meetingsByYear[oldYear] = this.meetingsByYear[oldYear].filter(
        (r: any) => r.id != reunion.id
      );
      // Add to the new year
      if (!this.meetingsByYear[newYear]) this.meetingsByYear[newYear] = [];
      this.meetingsByYear[newYear].push(reunion);

      // Update the list of years
      if (!this.years.includes(newYear)) {
        this.years.push(newYear);
        this.years.sort((a, b) => b - a);
      }
      // Remove the year if it becomes empty
      if (this.meetingsByYear[oldYear].length == 0) {
        delete this.meetingsByYear[oldYear];
        this.years = this.years.filter((year) => year !== oldYear);
        this.years.sort((a, b) => b - a);
      }
    }
  }

  // Go to project
  goToFiche(): void {
    this.router.navigateByUrl(
      '/dashboard/projects/' + this.selectedProjet?.id
    );
  }

  equals(a: any, b: any): boolean {
    return a?.id == b?.id;
  }
}
