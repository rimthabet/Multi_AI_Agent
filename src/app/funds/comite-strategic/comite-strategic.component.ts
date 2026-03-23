import { Component, DestroyRef, inject, OnInit, viewChild } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { ManagementService } from '../../services/management.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { formatDate } from '@angular/common';
import { DocumentUploadComponent } from "../../tools/document-upload/document-upload.component";
import { DatePipe } from '@angular/common';
import { ComiteCreateFormComponent } from "./comite-create-form/comite-create-form.component";
import { marked } from 'marked';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-comite-strategic',
  imports: [ClarityModule, CdsModule, DatePipe, DocumentUploadComponent, ComiteCreateFormComponent,FormsModule],
  templateUrl: './comite-strategic.component.html',
  styleUrl: './comite-strategic.component.scss'
})
export class ComiteStrategicComponent implements OnInit {

  comiteCreateForm = viewChild<ComiteCreateFormComponent>("comiteCreateForm");

  // Dependencies
  private destroyRef = inject(DestroyRef);
  private managementService = inject(ManagementService);
  private toastr = inject(ToastrService);
  private router = inject(Router);

  // PROPERTIES
  fonds: any[] = [];
  comitesStrategie: any[] = [];
  comite_conformite_documentaire: any[] = [];

  selectedFonds: any | undefined;
  comites_loading: boolean = false;
  openedComiteStrategique: boolean = false;
  selectedComiteStrategique: any | undefined;

  // INITIALIZE
  ngOnInit(): void {
    this.loadFunds();
    this.loadComitesPVs();
  }

  // Load funds 
  loadFunds() {
    this.managementService.findFondsList()
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.fonds = data;
          let lastVisitedFunds = sessionStorage.getItem('LastVisitedFunds');

          if (lastVisitedFunds) {
            let selectedFond = this.fonds.find(
              (fond: any) => fond.id == lastVisitedFunds
            );

            if (selectedFond) {
              this.selectedFonds = selectedFond;
            } else {
              this.selectedFonds = data[0];
              sessionStorage.setItem('LastVisitedFunds', data[0].id);
            }

            this.loadComitesStrategiques();

          } else {
            this.selectedFonds = data[0];
            sessionStorage.setItem('LastVisitedFunds', data[0].id);
          }

          this.switchTheFund(this.selectedFonds);
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Fonds non chargés!');
        }
      })
  }

  // Switch the fund
  switchTheFund(fund: any) {
    this.selectedFonds = fund;
    this.loadComitesStrategiques();
    sessionStorage.setItem('LastVisitedFunds', fund.id);
  }

  // Load comites strategiques
  loadComitesStrategiques() {
    this.comites_loading = true;
    this.managementService
      .findComitesStrategie(this.selectedFonds?.id)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.comitesStrategie = data;
        },
        error: (error) => {
          this.toastr.error('Erreur lors du chargement des comités', 'Erreur');
        },
        complete: () => {
          this.comites_loading = false;
        }
      })
  }

  onTabChange(tabIndex: number) {
    if (tabIndex === 1) { 
      this.loadComitesStrategiques();
    }
  }

  // Load comites PVs
  loadComitesPVs() {
    this.managementService
      .findConformitesByTache(1, 12)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.comite_conformite_documentaire = data;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des PVs:', error);
        }
      })
  }

  onComiteRefresh(event: any) {
    this.loadComitesStrategiques();
        if (this.openedComiteStrategique) {
      this.openedComiteStrategique = false;
      this.selectedComiteStrategique = undefined;
    }    
  }

  // Delete comite
  deleteComite(c: any) {
    if (
      confirm(
        'Veuillez confirmer cette suppression du comité du ' +
        formatDate(c.dateComite, 'dd/MM/yyyy', 'en')
      )
    ) {

      this.managementService.deleteComiteStrategie(c)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('', 'Comité supprimé avec succès!');
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
            this.toastr.error('Erreur lors de la suppression du comité', 'Erreur');
          },
          complete: () => {
            this.loadComitesStrategiques();
          }
        })
    }
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

  // Open edit modal
  openEditModal(comite: any) {
    this.openedComiteStrategique = true;
    this.selectedComiteStrategique = comite;
  }

  // Go to fiche
  goToFiche() {
    this.router.navigateByUrl('/dashboard/funds/' + this.selectedFonds?.id);
  }

  // Format markdown to html
  formatMD2HTML(libelle: string) {
    return marked.parse(libelle);
  }
}