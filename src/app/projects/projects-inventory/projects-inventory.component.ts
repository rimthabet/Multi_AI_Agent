import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CdsModule } from '@cds/angular';
import { ClarityModule, ClrCommonFormsModule } from '@clr/angular';
import { ProjectCardComponent } from "../projects-widgets/project-card/project-card.component";

interface FilterBadge {
  label: string;
  count: number;
  color: string;
}

@Component({
  selector: 'app-projects-grid',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ClarityModule, CdsModule, RouterModule, ClrCommonFormsModule, ProjectCardComponent],
  templateUrl: './projects-inventory.component.html',
  styleUrls: ['./projects-inventory.component.scss'],
})
export class ProjectsInventoryComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);

  fonds: any[] = [];
  filteredFonds: any | undefined;

  projets: any[] = [];
  filteredProjets: any[] = [];
  projectsStats: Map<any, FilterBadge> | undefined;

  etats: any[] = [];
  etats_rejets: any[] = [];
  filteredEtats: any[] = [];

  layout: string = 'grid';
  loading: boolean = true;
  etatChangeModalOpened: boolean = false;

  filter = { etat: undefined, fonds: undefined };
  profile: any | undefined;

  selectedProject: any = null;
  etatForm: FormGroup = this.formBuilder.group({
    etat: [undefined, [Validators.required]],
  });

  searchPatternForm!: FormGroup;

  // Lifecycle hooks
  ngOnInit(): void {

    // search pattern form
    this.searchPatternForm = this.formBuilder.group({
      pattern: [undefined],
    });

    // Trigger filterProjets on searchPatternForm changes
    this.searchPatternForm.controls['pattern'].valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (value: any) => this.filterProjets(value)
    });

    this.loadFunds();
    this.loadEtats();
    this.loadProjects();
  }

  // load fonds
  loadFunds(): void {
    this.managementService.findFonds().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data: any) => {
        this.fonds = data;
      },
      complete: () => this.filterProjets(),
      error: (error: any) => console.error(error)
    });
  }

  // load etats
  loadEtats(): void {
    this.managementService.findEtats().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data: any) => {
        data.sort((e1: any, e2: any) =>
          e1.libelle > e2.libelle ? 1 : e1.libelle < e2.libelle ? -1 : 0
        );
        this.etats = data.filter(
          (e: any) =>
            !(e.libelle as string).toLowerCase().startsWith('rejeté')
        );
        this.etats_rejets = data.filter((e: any) =>
          (e.libelle as string).toLowerCase().startsWith('rejeté')
        );
      },
      error: (error: any) => console.error(error)
    });
  }


  // load projects
  loadProjects() {
    this.managementService.findProjetWithFinancement().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data: any) => {
        data?.sort((a: any, b: any) =>
          (a.projet?.nom as string) > (b.projet?.nom as string)
            ? 1
            : (a.projet?.nom as string) < (b.projet?.nom as string)
              ? -1
              : 0
        );
        this.projets = data;
        this.filteredProjets = [...data];

        // projects stats
        this.projectsStats = data.reduce((acc: Map<string, FilterBadge>, proj: any) => {
          const etat = proj.projet.etatAvancement;
          if (!acc.has(etat.libelle) && etat.libelle != undefined && etat.libelle.trim() != '') {
            acc.set(etat.libelle, { count: 0, color: etat.couleur, label: etat.libelle });
          }
          acc.get(etat.libelle)!.count++;
          return acc;
        }, new Map<string, FilterBadge>());


        console.log("Stats", this.projectsStats);
        this.loading = false;
      },
      error: (error: any) => console.error(error)
    });
  }


  // filter projects with the search criteria
  filterProjets($event?: any): void {
    if ($event && $event != '') {
      this.filteredProjets = this.projets.filter((p: any) =>
        (p.projet.nom as string).toLowerCase().match($event!.toLowerCase())
      );
    } else this.filteredProjets = [...this.projets];

    if (this.filteredEtats.length > 0) {
      let filteredEtatsLibelles: any[] = this.filteredEtats.map(
        (e: any) => e.id
      );
      this.filteredProjets = this.filteredProjets.filter((p: any) =>
        filteredEtatsLibelles.includes(p.projet.etatAvancement?.id)
      );
    }

    if (this.filteredFonds) {
      this.filteredProjets = this.filteredProjets.filter((p: any) => {
        let allProjectFonds: any[] = [];
        p?.financements?.forEach((f: any) => {
          f?.fonds?.forEach((fd: any) => allProjectFonds.push(fd?.id));
        });
        return allProjectFonds.includes(this.filteredFonds?.id);
      });
    }
  }

  // filter fonds
  filterFonds(fonds: any) {
    this.filteredFonds = fonds;
    this.filterProjets();
  }

  // cancel filter fonds
  cancelFilterFonds() {
    this.filteredFonds = undefined;
    this.filterProjets();
  }

  // filter etat
  filterEtat(etat: any) {
    const even = (e: any) => e.id == etat.id;
    if (!this.filteredEtats.some(even)) {
      this.filteredEtats.push(etat);
      this.filterProjets();
    }
  }

  // cancel filter etat
  cancelFilterEtat(etat: any) {
    this.filteredEtats = this.filteredEtats.filter((e: any) => e.id != etat.id);
    this.filterProjets();
  }

  // display etat change modal  
  displayEtatChangeModal(projet: any) {

    this.selectedProject = projet;
    this.etatForm.setValue({
      etat: projet?.etatAvancement ? projet?.etatAvancement : '',
    });
    this.etatChangeModalOpened = true;
  }

  // update projet etat
  updateEtat() {
    let etat = {
      id: this.selectedProject.id,
      projet: this.selectedProject,
      etat: this.etatForm.controls['etat'].value,
    };

    this.managementService.updateProjetEtat(etat)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.toastr.success('', "État d'avancement mis à jour avec succès!");
          this.etatChangeModalOpened = false;
          this.selectedProject = null;
          this.loadProjects();
        },
        error: (error: any) => {
          console.log('error', error);
          this.toastr.error('', "Il n'est pas possible de mettre à jour l'état d'avancement du projet.");
        }
      })
  }

  // delete projet
  deleteProjet(projet: any) {
    if (confirm('Veuillez confirmer cette suppression!')) {
      this.managementService.deleteProjet(projet?.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Projet supprimé avec succès!');
            this.loadProjects();
          },
          error: (error: any) => {
            console.log('error', error);
            this.toastr.error('', "Il n'est pas possible de supprimer le projet.");
          }
        })
    }
  }


  // In your component class
  get statsArray() {
    if (!this.projectsStats) return [];
    return Array.from(this.projectsStats.entries());
  }
}
