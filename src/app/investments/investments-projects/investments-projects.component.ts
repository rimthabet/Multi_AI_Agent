import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ProjectTimelineComponent } from './project-timeline/project-timeline.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-investments-projects',
  imports: [
    ClarityModule,
    CdsModule,
    RouterLink,
    DecimalPipe,
    ProjectTimelineComponent,
    FormsModule,
  ],
  templateUrl: './investments-projects.component.html',
  styleUrls: ['./investments-projects.component.scss'],
})
export class InvestmentsProjectsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);

  projets: any[] = [];
  allProjets: any[] = [];
  fonds: any[] = [];
  filteredFonds: any[] = [];
  loading: boolean = false;

  selectedFonds: any[] = []; 

  ngOnInit(): void {
    this.loadProjetsAndPFA();
  }

  loadProjetsAndPFA() {
    this.loading = true;

    this.managementService
      .findProjetsAndPFA()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          data.sort((a: any, b: any) => a.p.nom.localeCompare(b.p.nom));

          this.allProjets = data;
          this.projets = data;

          // Récupération des fonds uniques
          const fondsMap = new Map<number, any>();
          data.forEach((projet: any) => {
            projet.pfa?.forEach((pfaItem: any) => {
              const fondsItem = pfaItem.comiteInvestissement?.fonds;
              if (fondsItem && !fondsMap.has(fondsItem.id)) {
                fondsMap.set(fondsItem.id, fondsItem);
              }
            });
          });

          this.fonds = Array.from(fondsMap.values());
        },
        error: (err) => console.error(err),
        complete: () => (this.loading = false),
      });
  }

  // Applique le filtre en fonction des fonds sélectionnés
  applyFilter() {
    if (!this.selectedFonds || this.selectedFonds.length === 0) {
      this.projets = this.allProjets;
      return;
    }

    this.projets = this.allProjets.filter((projet: any) =>
      projet.pfa?.some((pfaItem: any) =>
        this.selectedFonds.map((f) => f.id).includes(pfaItem.comiteInvestissement?.fonds?.id)
      )
    );
  }

  // Ajouter un fonds au filtre
  filterFonds(selection: any) {
    this.selectedFonds = selection; 
    this.applyFilter();
  }
}
