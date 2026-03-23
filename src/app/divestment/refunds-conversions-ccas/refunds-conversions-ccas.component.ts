import { CommonModule, formatDate } from '@angular/common';
import { Component, DestroyRef, inject, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../services/management.service';
import { DocumentUploadComponent } from '../../tools/document-upload/document-upload.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DivestmentRefundsConversionsCcaXlsxService } from '../../services/reports/divestment-refunds-conversions-cca-xlsx.service';

@Component({
  selector: 'refunds-conversions-ccas',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    DocumentUploadComponent,
    RouterLink
  ],
  templateUrl: './refunds-conversions-ccas.component.html',
  styleUrl: './refunds-conversions-ccas.component.scss'
})
export class RefundsConversionsCCAsComponent {

  //  Injects and ViewChild 
  docUpload = viewChild.required<DocumentUploadComponent>("DocumentUploadComponent");

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);
  private readonly divestmentRefundsConversionsCcaXlsxService = inject(DivestmentRefundsConversionsCcaXlsxService);

  public remboursementForm!: FormGroup;

  fonds: any[] = [];
  rembourcementsCCA: any[] = [];
  conformite_documentaires: any[] = [];

  selectedFonds: any | undefined;
  selectedRemboursement: any | undefined;
  selectedConversion: any | undefined;

  fonds_loading: boolean = true;
  loading: boolean = false;
  remboursementModalOpened: boolean = false;
  openedDocumentModal: boolean = false;

  ngOnInit(): void {

    this.remboursementForm = this.fb.group({
      dateRealisation: ['', [Validators.required]],
      montantRealise: ['', [Validators.required]],
    });

    this.loadFundsList();

  }


  // load funds list
  loadFundsList() {
    // Load the funds list
    this.managementService.findFondsList().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.fonds = data.filter(
          (fonds: any) => fonds.etat?.libelle !== 'En cours de levée'
        );
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
        } else {
          this.selectedFonds = data[0];
          sessionStorage.setItem('LastVisitedFunds', data[0].id);
        }

        this.selectFund(this.selectedFonds);
        this.loadRembourcementsConversionCca();
        this.loadConformite();
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Fonds non chargés!');
      },
      complete: () => (this.fonds_loading = false),
    })
  }

  // Select the fund
  selectFund(fund: any) {
    this.selectedFonds = fund;
    this.loadRembourcementsConversionCca();
    this.loadConformite();
    sessionStorage.setItem('LastVisitedFunds', fund.id);
  }

  // Load the conformite
  loadConformite() {
    this.managementService
      .findConformitesByTache(7, 14)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => (this.conformite_documentaires = data),
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Conformité documentaire non chargée!');
        },
      })
  }

  // Load the rembourcements conversion CCA
  loadRembourcementsConversionCca() {
    this.loading = true;
    this.managementService
      .findRemboursementByFonds(this.selectedFonds.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.rembourcementsCCA = data.map((item: any) => {
            item.latestDate = this.getLatestDate(item.rc);
            item.totalAmount = this.getTotalAmount(item.rc);

            item.rc.forEach((rc: any) => {
              rc.documentsCount = rc.documents?.length ?? 0;

              rc.ratio = (100.0 * rc.montantRealise) / item.totalAmount;
            });
            return item;
          });

          // Sort the data
          this.rembourcementsCCA.sort((a: any, b: any) => {
            if (a.sc.financement.projet.nom > b.sc.financement.projet.nom)
              return 1;
            if (a.sc.financement.projet.nom < b.sc.financement.projet.nom)
              return -1;
            if (a.sc.dateSignatureContrat < b.sc.dateSignatureContrat)
              return -1;
            if (a.sc.dateSignatureContrat > b.sc.dateSignatureContrat)
              return 1;
            return 0;
          });
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Rembourcements conversion CCA non chargés!');
        },
        complete: () => (this.loading = false),
      })
  }

  // Get the latest date
  getLatestDate(rcArray: any): string {
    return rcArray.reduce((latest: any, r: any) => {
      return new Date(r.dateRealisation) > new Date(latest)
        ? r.dateRealisation
        : latest;
    }, rcArray[0]?.dateRealisation);
  }

  // Get the total amount
  getTotalAmount(rcArray: any): number {
    return rcArray.reduce(
      (total: number, r: any) => total + r.montantRealise,
      0
    );
  }

  // Display the remboursement modal
  displayRemboursementModal(rembourcement: any) {
    this.selectedRemboursement = rembourcement;
    this.remboursementModalOpened = true;
  }

  // Save the remboursement
  saveRemboursementCca() {
    const [d1, m1, y1] = this.remboursementForm?.value['dateRealisation'].split('/');
    let remboursementData = {
      invSouscriptionCCA: this.selectedRemboursement.sc,
      dateRealisation: new Date(y1, m1 - 1, d1),
      montantRealise: this.remboursementForm.value['montantRealise'],
    };

    this.managementService
      .saveConversionRemboursement(remboursementData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('Remboursement sauvegardé avec succès');
          this.loadRembourcementsConversionCca();
          this.remboursementModalOpened = false;
        },
        error: (err) => {
          this.toastr.error('Erreur lors de la sauvegarde du remboursement');
          console.error(err);
        },
      });
  }

  // Delete the remboursement
  deleteRemboursement(remboursement: any) {
    if (confirm('Veuillez confirmer cette suppression ?')) {
      this.managementService
        .deleteRemboursementConversion(remboursement.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('Remboursement supprimé avec succès!');
            this.loadRembourcementsConversionCca();
          },
          error: () => {
            this.toastr.error('Erreur lors de la suppression du remboursement');
          },
        })
    }
  }

  // Show the document modal
  showDocumentModal(conversion: any) {
    this.selectedConversion = conversion;
    this.openedDocumentModal = true;
  }

  // Go to the fonds fiche
  goToFiche() {
    this.router.navigateByUrl('/dashboard/funds/' + this.selectedFonds?.id);
  }

  // Export the remboursements conversion CCA
  exportRembourcementsConversionCca() {
    this.divestmentRefundsConversionsCcaXlsxService.exportToExcel(
      this.rembourcementsCCA,
      this.selectedFonds
    );
  }

  documentsCount(item: any): number {
    return item?.documents ? item.documents.length : 0;
  }

  equals(a: any, b: any) {
    return a?.id == b?.id;
  }

}

