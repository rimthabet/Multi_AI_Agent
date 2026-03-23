import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CommonModule } from '@angular/common';
import { CdsModule } from '@cds/angular';
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { NgxGaugeModule } from 'ngx-gauge';
import { DecimalPipe } from '@angular/common';
import { DatePipe } from '@angular/common';
import { PercentPipe } from '@angular/common';
import { HorizontalScrollerComponent } from "../../widgets/horizontal-scroller/horizontal-scroller.component";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-investments-vestings',
  imports: [CommonModule, ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, NgxGaugeModule, DecimalPipe, DatePipe, PercentPipe, RouterLink, HorizontalScrollerComponent],
  templateUrl: './investments-vestings.component.html',
  styleUrl: './investments-vestings.component.scss'
})
export class InvestmentsVestingsComponent implements OnInit {


  // injects
  private readonly managementService = inject(ManagementService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  title: string = 'Libérations des fonds dans les projets';

  fonds: any[] | undefined;
  liberations: any[] = [];

  selectedLiberation: any | undefined;
  selectedFonds: any | undefined;

  totalActions: number = 0;

  engageActions: number = 0;
  engageOCA: number = 0;
  engageCCA: number = 0;

  libereActions: number = 0;
  libereOCA: number = 0;
  libereCCA: number = 0;

  totalParticipation: number = 0;

  loading: boolean = true;
  loadingLiberations: boolean = true;
  i: any;

  ngOnInit(): void {
    this.loadFondsList();
  }

  // select fonds
  selectFund(value: any) {
    this.selectedFonds = value;
    this.loadFondsLiberations(value.fonds.id);
    sessionStorage.setItem('LastVisitedFunds', value.fonds.id);
  }

  // load fonds list
  loadFondsList() {
    this.loading = true;

    this.managementService.findFondsAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {

        this.fonds = data.filter(
          (fonds: any) =>
            fonds.fonds?.etat?.libelle !== 'En cours de levée' ||
            (fonds.sousLib?.length > 0 &&
              fonds.sousLib?.filter(
                (sl: any) =>
                  sl.souscription != null && sl.liberations?.length > 0
              ).length > 0)
        );


        // set default fonds
        try {
          let lastVisitedFunds = sessionStorage.getItem('LastVisitedFunds');

          if (lastVisitedFunds) {
            lastVisitedFunds = this.fonds?.filter(
              (f: any) => lastVisitedFunds == f.fonds.id
            )[0];
            this.selectFund(lastVisitedFunds);
          } else this.selectFund(data[0]);
        } catch { }

      },
      error: (data: any) => console.log(data),
      complete: () => {
        this.loading = false;
      }
    })
  }


  // load fonds liberations
  loadFondsLiberations(id: any) {
    this.loadingLiberations = true;
    this.totalActions = 0;

    this.engageActions = 0;
    this.engageOCA = 0;
    this.engageCCA = 0;

    this.libereActions = 0;
    this.libereOCA = 0;
    this.libereCCA = 0;

    this.totalParticipation = 0;

    this.managementService.findFondsLiberation(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {

        data?.forEach((p: any) => {
          p.projet.nom = p.projet.nom.toUpperCase();
          p.rows = 1;
          if (p.pfcp) {
            p.pfcp.part = ((p.pfcp.part || 0) * 100.0).toFixed(2);
            this.totalParticipation += p.pfcp.montant || 0;
          }

          p.totalLibere = 0;

          p.flrl = p.flrl.filter(
            (pf: any) =>
              pf.libA?.length > 0 || pf.libO?.length > 0 || pf.libC?.length > 0
          );
          p.flrl.forEach((f: any) => {
            f.rows = 1;
            f.rows += f.libA ? f.libA.length : 0;
            f.rows += f.libO ? f.libO.length : 0;
            f.rows += f.libC ? f.libC.length : 0;
            p.rows += f.rows;

            f.totalLibere = 0;
            f.libA?.forEach((lib: any) => {
              f.totalLibere += lib.montantLiberation;
              this.libereActions += lib.montantLiberation;
            });
            f.libO?.forEach((lib: any) => {
              f.totalLibere += lib.montantLiberation;
              this.libereOCA += lib.montantLiberation;
            });
            f.libC?.forEach((lib: any) => {
              f.totalLibere += lib.montantLiberation;
              this.libereCCA += lib.montantLiberation;
            });
            f.regC?.forEach((reg: any) => {
              p.pfcp.montant -= reg.montantPaye;
              this.totalParticipation -= reg.montantPaye;
            });
            p.totalLibere += f.totalLibere;

            f.total = 0;
            try {
              f.total += f.libA[0].souscription?.montant;
              this.engageActions += f.libA[0].souscription?.montant;
              this.totalActions += f.libA[0].souscription?.actions;
            } catch { }
            try {
              f.total += f.libO[0].souscription?.montant;
              this.engageOCA += f.libO[0].souscription?.montant;
            } catch { }
            try {
              f.total += f.libC[0].souscription?.montant;
              this.engageCCA += f.libC[0].souscription?.montant;
            } catch { }
          });
        });

        this.liberations = data
          ?.filter((p: any) => p.totalLibere > 0)
          .sort((p1: any, p2: any) => {
            if (p1.projet.nom > p2.projet.nom) return 1;
            if (p1.projet.nom < p2.projet.nom) return -1;
            return 0;
          });

      },
      error: (error: any) => {
        console.error('Error loading fonds liberations:', error);
      },
      complete: () => {
        this.loadingLiberations = false;
      }
    });

  }

  onDetailOpen() {
    this.selectedLiberation = undefined;
  }

  equals(a: any, b: any) {
    return a?.fonds?.id == b?.fonds?.id;
  }


  // export to excel
  exportLiberationsToExcel(selectedFonds: any): void {
    const totals = {
      totalActions: this.totalActions,
      engageActions: this.engageActions,
      engageOCA: this.engageOCA,
      engageCCA: this.engageCCA,
      libereActions: this.libereActions,
      libereOCA: this.libereOCA,
      libereCCA: this.libereCCA,
      totalParticipation: this.totalParticipation,
    };

    // // Appeler la méthode exportToExcel en passant l'objet totals et selectedFonds
    // this.liberationsXlsxService.exportToExcel(
    //   this.liberations,
    //   totals,
    //   selectedFonds
    // );
  }

  goToFiche() {
    this.router.navigateByUrl(
      '/dashboard/funds/' + this.selectedFonds.fonds?.id
    );
  }


  getCodeFromColor(color: string): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(color)
      .trim();
  }
}
