import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { CommonModule, formatDate } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';
import { Router } from '@angular/router';
import { DocumentUploadComponent } from "../../../tools/document-upload/document-upload.component";
import { marked } from 'marked';
import { LandmarkEventCreateFormComponent } from "./landmark-event-create-form/landmark-event-create-form.component";

@Component({
  selector: 'app-landmark-event',

  imports: [CdsModule, ClarityModule, CommonModule, DocumentUploadComponent, LandmarkEventCreateFormComponent],
  templateUrl: './landmark-event.component.html',
  styleUrl: './landmark-event.component.scss'
})
export class LandmarkEventComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);

  projets: any[] | undefined;
  selectedProjet: any | undefined;

  faitsMarquants: any[] | undefined;
  fm_conformite_documentaire: any[] = [];

  selectedFm: any | undefined;

  opened: boolean = false;
  loading: boolean = false;


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
    this.loadFaitsMarquants();
    this.loadFaitMarquantPVs();
  }

  loadFaitsMarquants() {
    this.loading = true;
    this.managementService
      .findFaitMarquant(this.selectedProjet?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.faitsMarquants = data;
          this.faitsMarquants?.sort((a: any, b: any) => {
            if (a.dateFM < b.dateFM) return 1;
            if (a.dateFM > b.dateFM) return -1;
            return 0;
          });
        },
        complete: () => (this.loading = false),
      })

  }

  loadFaitMarquantPVs() {
    this.managementService
      .findConformitesByTache(5, 5)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.fm_conformite_documentaire = data;
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Conformités non chargées!');
        },
        complete: () => { },
      })

  }

  trimPath(path: any) {
    try {
      path = (path as string);
      return path;
    } catch {
      return '';
    }
  }

  openEditModal(fm: any) {
    this.opened = true;
    this.selectedFm = fm;

  }

  deleteFaitMarquant(fm: any) {
    if (
      confirm(
        'Veuillez confirmer cette suppression du fait marquant du' +
        formatDate(fm.dateFM, 'dd/MM/yyyy', 'fr')
      )
    ) {
      this.managementService.deleteFaitMarquant(fm).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) =>
          this.toastr.success('', 'Fait marquant supprimé avec succès!'),
        complete: () => this.loadFaitsMarquants(),
      })
    }
  }

  // Format markdown to html
  formatMD2HTML(libelle: string) {
    return marked.parse(libelle);
  }


  // Go to project fiche
  goToFiche() {
    this.router.navigateByUrl(
      '/dashboard/projects/' + this.selectedProjet?.id
    );
  }
}
