import { CommonModule, formatDate } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DivestmentRefundsConversionsOcasXlsxService } from '../../services/reports/divestment-refunds-conversions-ocas-xlsx.service';
import { DocumentUploadComponent } from '../../tools/document-upload/document-upload.component';

@Component({
  selector: 'refunds-conversions-ocas',
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
  templateUrl: './refunds-conversions-ocas.component.html',
  styleUrl: './refunds-conversions-ocas.component.scss'
})
export class RefundsConversionsOCAsComponent implements OnInit {

  docUpload = viewChild.required<DocumentUploadComponent>("DocumentUploadComponent");

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);
  private readonly divestmentRefundsConversionsOcasXlsxService = inject(DivestmentRefundsConversionsOcasXlsxService);

  public conversionForm!: FormGroup;

  fonds: any[] = [];
  conversionOCA: any[] = [];
  conformite_documentaires: any[] = [];

  selectedFonds: any = null;
  selectedConversion: any = null;
  selectedItem: any = null;

  openedDocumentModal: boolean = false;
  fonds_loading: boolean = true;
  loading: boolean = false;
  conversionModalOpened: boolean = false;

  ngOnInit(): void {

    this.conversionForm = this.fb.group({
      dateRealisation: ['', [Validators.required]],
      montantRealise: ['', [Validators.required]],
    });

    // Gets the funds list
    this.loadFundsList();
  }


  // Fetch list of funds
  loadFundsList() {
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
        this.loadRembourcementsConversionOca();
        this.loadConformite();
        this.selectFund(this.selectedFonds);
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Fonds non chargés!');
      },
      complete: () => (this.fonds_loading = false),
    })
  }


  // Select fund
  selectFund(fund: any) {
    this.selectedFonds = fund;
    this.loadRembourcementsConversionOca();
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

  // Load the rembourcements conversion OCA
  loadRembourcementsConversionOca() {
    this.loading = true;
    this.managementService
      .findConversionByFonds(this.selectedFonds.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.conversionOCA = data.map((item: any) => {
            item.latestDate = this.getLatestDate(item.rc);
            item.totalAmount = this.getTotalAmount(item.rc);

            item.rc.forEach((rc: any) => {
              rc.documentsCount = rc.documents?.length ?? 0;

              rc.ratio = (100.0 * rc.montantRealise) / item.totalAmount;
            });
            return item;
          });

          data.sort((a: any, b: any) => {
            if (a.so.financement.projet.nom > b.so.financement.projet.nom)
              return 1;
            if (a.so.financement.projet.nom < b.so.financement.projet.nom)
              return -1;

            if (a.so.dateBulletin < b.so.dateBulletin) return -1;
            if (a.so.dateBulletin > b.so.dateBulletin) return 1;

            return 0;
          });

          this.conversionOCA = data;
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Rembourcements conversion OCA non chargés!');
        },
        complete: () => (this.loading = false),
      })
  }

  // Save the conversion OCA
  saveConversionOca() {
    const [d1, m1, y1] = this.conversionForm?.value['dateRealisation'].split('/');
    let conversion = {
      invSouscriptionOCA: this.selectedConversion.so,
      dateRealisation: new Date(y1, m1 - 1, d1),
      montantRealise: this.conversionForm.value['montantRealise'],
    };

    this.managementService.saveConversionRemboursement(conversion).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toastr.success('Conversion sauvegardé avec succès');
        this.loadRembourcementsConversionOca();

        this.conversionModalOpened = false;
      },
      error: (err) => {
        this.toastr.error('Erreur lors de la sauvegarde du conversion');
        console.error(err);
      },
    });
  }

  // Display the conversion modal
  displayConversion(data: any) {
    this.selectedConversion = data;
    this.conversionModalOpened = true;
  }

  // Set the selected conversion
  setSelectedConversion(data: any) {
    this.selectedConversion = data;
  }

  // Delete the conversion
  deleteConversion(conversion: any) {
    if (confirm('Veuillez confirmer cette suppression ?')) {
      this.managementService
        .deleteRemboursementConversion(conversion.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('Conversion supprimé avec succès!');
            this.loadRembourcementsConversionOca();
          },
          error: () => {
            this.toastr.error('Erreur lors de la suppression du conversion');
          },
        })
    }
  }

  // Show the document modal
  showDocumentModal(data: any) {
    this.selectedItem = data;
    this.openedDocumentModal = true;
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
      (total: number, r: any) => total + r?.montantRealise,
      0
    );
  }

  // Go to the fonds fiche
  goToFiche() {
    this.router.navigateByUrl('/dashboard/funds/' + this.selectedFonds?.id);
  }

  // Get the documents count
  documentsCount(item: any): number {
    return item?.documents ? item.documents.length : 0;
  }

  // Export the rembourcements conversion OCA
  exportRembourcementsConversionOca() {
    this.divestmentRefundsConversionsOcasXlsxService.exportToExcel(
      this.conversionOCA,
      this.selectedFonds
    );
  }

  // Check if two objects are equal
  equals(a: any, b: any) {
    return a?.id == b?.id;
  }


}
