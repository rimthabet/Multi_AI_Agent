import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinct, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SectorActivityXlsxService } from '../../../services/reports/sector-activity-xlsx.service';

@Component({
  selector: 'sector-activity',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    RouterLink
  ],
  templateUrl: './sector-activity.component.html',
  styleUrl: './sector-activity.component.scss'
})
export class SectorActivityComponent implements OnInit {

  //Dependency injection
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);
  private readonly sectorActivityXlsxService = inject(SectorActivityXlsxService);

  //Properties
  fonds: any[] | undefined;
  selectedFonds: any | undefined;
  totalActif: number = 0;
  totalParticipation: number = 0;
  secteurs: any[] = [];
  loading1: boolean = true;
  loading2: boolean = true;

  //Initialization
  ngOnInit(): void {
    this.loadFondsList();
  }

  //Select fonds
  selectFonds(value: any) {
    this.selectedFonds = value;
    sessionStorage.setItem('LastVisitedFunds', value?.fonds?.id);
    this.loadSecteursActivites();
  }

  //Load fonds list
  loadFondsList() {
    this.loading1 = true;
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

        try {
          let lastVisitedFunds = sessionStorage.getItem('LastVisitedFunds');

          if (lastVisitedFunds) {
            lastVisitedFunds = this.fonds?.filter(
              (f: any) => lastVisitedFunds == f.fonds.id
            )[0];
            this.selectFonds(lastVisitedFunds);
          } else this.selectFonds(data[0]);
        } catch { }

      },
      error: (data: any) => console.log(data),
      complete: () => {
        this.loading1 = false;
      }
    })
  }

  //Load secteurs activites
  loadSecteursActivites() {
    this.secteurs = [];
    this.totalActif = 0;
    this.totalParticipation = 0;
    this.loading2 = true;

    this.managementService
      .findFondsSouscriptionsProjets(this.selectedFonds.fonds.id)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          data.fs.forEach(
            (sub: any) => (this.totalActif += sub.montantSouscription)
          );

          of(...data.fp.map((p: any) => p.p?.secteurs[0]))
            .pipe(distinct((s: any) => s?.id))
            .subscribe((data: any) => {
              if (data) {
                this.secteurs.push(data);
              }
            });

          this.secteurs.forEach((s: any) => {
            if (s) {
              s.projets = [];
              s.actif = 0;

              data.fp
                .filter((p: any) => p.p.secteurs[0]?.id == s?.id)
                .forEach((data: any) => {
                  // Vérifiez si le projet a des secteurs
                  if (data.p.secteurs.length > 0) {
                    data.actif = 0;

                    data.psa.forEach((sub: any) => {
                      s.actif += sub.montant;
                      data.actif += sub.montant;
                    });
                    data.pso.forEach((sub: any) => {
                      s.actif += sub.montant;
                      data.actif += sub.montant;
                    });
                    data.psc.forEach((sub: any) => {
                      s.actif += sub.montant;
                      data.actif += sub.montant;
                    });

                    // Withdrowing the installment already paied
                    data.cc.forEach((c: any) => {
                      s.actif -= c.montantPaye;
                      data.actif -= c.montantPaye;
                    });

                    data.part = data.actif / this.totalActif;
                    s.projets.push(data);
                  }
                });

              s.part = s.actif / this.totalActif;
              this.totalParticipation += s.actif;

              let uniqueProjects: any[] = [];
              of(...s.projets)
                .pipe(distinct((p: any) => p.p.id))
                .subscribe((data: any) => {
                  uniqueProjects.push(data);
                });
              uniqueProjects.sort((p1: any, p2: any) => {
                if (p1.p.nom > p2.p.nom) return 1;
                if (p1.p.nom < p2.p.nom) return -1;
                return 0;
              });
              s.projets = uniqueProjects;
            }
          });

          this.secteurs.sort((s1: any, s2: any) => {
            if (s1.libelle > s2.libelle) return 1;
            if (s1.libelle < s2.libelle) return -1;
            return 0;
          });
        },
        error: (data: any) => console.log(data),
        complete: () => {
          this.loading2 = false;
        },
      })
  }


  //Export secteurs to excel
  exportSecteursToExcel() {
    if (
      this.secteurs &&
      this.secteurs.length > 0 &&
      this.selectedFonds &&
      this.selectedFonds.fonds
    ) {
      let totalActif = this.totalActif;
      let totalParticipation = this.totalParticipation;
      let ratioSecteurActivite = this.selectedFonds.fonds.ratioSecteurActivite;
      let ratioSociete = this.selectedFonds.fonds.ratioSociete;
      let fondsName = this.selectedFonds.fonds.denomination;

      let dataToExport = {
        secteurs: this.secteurs.map((secteur) => ({
          ...secteur,
          ratioSecteurActivite,
          ratioSociete,
        })),
        totalActif,
        totalParticipation,
        fondsName,
      };

      this.sectorActivityXlsxService.exportToExcel(dataToExport);
    } else {
      console.error('Aucune donnée à exporter.');
    }
  }

  //Go to fonds fiche
  goToFiche() {
    this.router.navigateByUrl(
      '/dashboard/funds/' + this.selectedFonds.fonds?.id
    );
  }

}
