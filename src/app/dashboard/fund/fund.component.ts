import { AfterViewInit, Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../services/management.service';
import { environment } from '../../../environment/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { distinct, firstValueFrom, lastValueFrom, of, Subject } from 'rxjs';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { FundSheetPdfService } from '../../services/reports/fund-sheet-pdf.service';
import { ClarityModule } from '@clr/angular';
import { CommonModule } from '@angular/common';
import { FundDetailsComponent } from './fund-details/fund-details.component';
import { FundDocsComponent } from './fund-docs/fund-docs.component';
import { BarChart03Component } from "../../widgets/bar-chart-03/bar-chart-03.component";
import { BarChart02Component } from "../../widgets/bar-chart-02/bar-chart-02.component";
import { NgxGaugeModule } from 'ngx-gauge';
import { FundsProjectsSectorsComponent } from "./funds-projects-sectors/funds-projects-sectors.component";
import { FundsComiteInvestmentComponent } from "./funds-comite-investment/funds-comite-investment.component";
import { FundsComiteStrategicComponent } from "./funds-comite-strategic/funds-comite-strategic.component";
import { HorizontalScrollerComponent } from "../../widgets/horizontal-scroller/horizontal-scroller.component";
import { FundSubscriberSubscriptionsGridComponent } from "./fund-subscriber-subscriptions-grid/fund-subscriber-subscriptions-grid.component";
@Component({
  selector: 'app-fund',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    NgxGaugeModule,
    FundDetailsComponent,
    FundDocsComponent,
    BarChart03Component,
    BarChart02Component,
    FundsProjectsSectorsComponent,
    FundsComiteInvestmentComponent,
    FundSubscriberSubscriptionsGridComponent,
    FundsComiteStrategicComponent,
    HorizontalScrollerComponent,
    FundSubscriberSubscriptionsGridComponent
  ],
  templateUrl: './fund.component.html',
  styleUrl: './fund.component.scss'
})
export class FundComponent implements AfterViewInit {

  //ViewChild
  fundDetailsComponent = viewChild<FundDetailsComponent>("fundDetailsComponent");
  fundDocsComponent = viewChild<FundDocsComponent>("fundsDocsComponent");
  chartDiv = viewChild<ElementRef>("chartDiv");
  chartDiv2 = viewChild<ElementRef>("chartDiv2");

  //Injects
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fundSheetPdfService = inject(FundSheetPdfService);

  chartWidth: number | undefined;
  chartWidth2: number | undefined;

  loadingFonds: boolean = true;
  loadingSouscription: boolean = true;
  loadingComiteInv: boolean = true;
  loadingComiteStrg: boolean = true;
  loadingSecteur: boolean = true;
  loadingListFunds: boolean = true;
  isAdmin: boolean = false;

  sgweb: string = environment.sgweb;
  fundData: any | undefined;
  mandat: any | undefined;

  totalActif: number = 0;
  totalParticipation: number = 0;
  totalMontantSouscription: number = 0;

  souscriptions: any = [];
  comitesInvestissement: any[] = [];
  comitesStrategie: any[] = [];
  mandats: any[] = [];
  secteurs: any[] = [];
  secteursData: any[] = [];

  fonds: any[] = [];
  allEtablissements: any = [];
  subscribers: any[] = [];

  chartData: any = {
    categories: [],
    montantData: [],
    projetsData: [],
    partData: []
  };

  userRoles: any | undefined;
  profile: any | undefined;

  // ngAfterViewInit
  ngAfterViewInit(): void {
    this.loadFundsList();
    this.loadTypesEtablissements();
    this.loadFund();
  }

  //Load the funds list
  loadFundsList() {
    this.loadingListFunds = true;
    this.managementService.findFonds().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.fonds = data;

        if (this.profile?.attributes?.fonds.length > 0) {
          this.fonds = this.fonds.filter((fonds: any) =>
            this.profile?.attributes?.fonds.includes(
              fonds.fonds.id.toString()
            )
          );
        }
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Fonds non chargés!');
      },
      complete: () => {
        this.loadingListFunds = false;
      },
    })
  }

  //Load the types of etablissements
  loadTypesEtablissements() {
    this.managementService.findEtablisements().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.allEtablissements = data;

        this.allEtablissements = this.allEtablissements.map((e: any) => {
          return { libelle: e.libelle, montant: 0 };
        });

      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Etablissements non chargés!');
      },
      complete: () => {
        this.loadingListFunds = false;
      },
    })
  }

  //Summarize the subscriptions
  summarizeSubscriptions() {

    let souscripteursIndex = new Map<string, any>(); // {subscriber: Subscriber, montant: montant}
    let etablissementsIndex = new Map<string, any>(); // {etablissement: Etablissement, montant: montant}

    this.souscriptions?.souscriptions?.forEach((s: any) => {
      this.totalMontantSouscription += s.souscription.montantSouscription;

      // Subscriber grouping
      let subsc = s.souscription.souscripteur;
      let last_record1 = souscripteursIndex.get(subsc?.libelle);

      if (last_record1 == undefined) {
        last_record1 = {
          subscriber: subsc,
          montant: s.souscription.montantSouscription,
        };
      } else {
        last_record1.montant += s.souscription.montantSouscription;
      }
      souscripteursIndex.set(subsc?.libelle, last_record1);

      // Etablissement grouping
      let etablissement = s.souscription.souscripteur?.etablissement;
      let last_record2 = etablissementsIndex.get(etablissement?.libelle); // In case it is not existant
      if (last_record2 == undefined) {
        last_record2 = {
          etablissement: etablissement,
          montant: s.souscription.montantSouscription,
        };
      } else {
        // In case it is existant
        last_record2.montant += s.souscription.montantSouscription;
      }
      etablissementsIndex.set(etablissement?.libelle, last_record2);
    });

    this.subscribers = Array.from(souscripteursIndex.values());
    this.subscribers.sort((s1: any, s2: any) => {
      if (s1.montant < s2.montant) return 1;
      if (s1.montant > s2.montant) return -1;
      return 0;
    });

    this.allEtablissements.forEach((e: any) => {
      e.montant = etablissementsIndex.get(e.libelle)?.montant || 0;
    });

    this.allEtablissements.sort((s1: any, s2: any) => {
      if (s1.montant < s2.montant) return 1;
      if (s1.montant > s2.montant) return -1;
      return 0;
    });
  }

  //Load the fund details
  loadFund() {
    let id = this.activatedRoute.snapshot.paramMap.get('id');
    this.loadFundData(id);
    this.loadSouscriptions(id);
    this.loadComitieInvestissements(id);
    this.loadComitesStrategie(id);
    this.loadMandat(id);
    this.loadSecteursActivites(id);
  }

  //Load the fund data
  loadFundData(id: any) {
    this.loadingFonds = true;
    this.managementService.findFondsById(Number(id)).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.fundData = data;
      }, error: () => {
        this.toastr.error('Erreur de chargement!', 'Fonds non chargés!');
      },
      complete: () => {
        this.loadingFonds = false;
      },
    })
  }

  //Select the fund
  selectFonds(fond: any) {

    this.loadFundData(fond.id);
    this.loadSouscriptions(fond.id);
    this.loadComitieInvestissements(fond.id);
    this.loadComitesStrategie(fond.id);
    this.loadMandat(fond.id);
    this.loadSecteursActivites(fond.id);
  }

  //Load the fund souscriptions
  async loadSouscriptions(id: any) {

    this.loadingSouscription = true;

    // Create a subject to signal when the subscription is complete
    const done$ = new Subject<void>();

    // Load the souscriptions
    this.managementService.findFondsSouscriptionsList(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {

        this.souscriptions = data;
        this.totalActif = data.souscriptions.reduce(
          (total: number, souscription: any) => {
            let montant = souscription.souscription.montantSouscription;
            return total + montant;
          },
          0
        );

      },
      complete: () => {

        // Signal that the subscription is complete
        this.loadingSouscription = false;
        done$.next();
        done$.complete();
      },
    })

    // Wait for the subscription to complete
    await firstValueFrom(done$);
    this.summarizeSubscriptions();

  }

  //Load the fund comites
  loadComitieInvestissements(id: any) {
    this.loadingComiteInv = true;
    this.managementService.fetchComiteInvestissementsByFonds(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.comitesInvestissement = data;
        this.comitesInvestissement.sort((a, b) => {
          if (a.dateComite < b.dateComite) return 1;
          if (a.dateComite > b.dateComite) return -1;
          return 0;
        });
        this.comitesInvestissement = this.comitesInvestissement.slice(0, 4).reverse();
        //this.fundComiteInvComponent?.setComite(this.comites);
      }, error: () => {
        this.toastr.error('Erreur de chargement!', 'Comites non chargés!');
      },
      complete: () => {
        this.loadingComiteInv = false;
      },
    })
  }

  //Load the fund comites
  loadComitesStrategie(id: any): void {
    this.loadingComiteStrg = true;
    this.managementService.findComitesStrategie(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.comitesStrategie = data;
        this.comitesStrategie.sort((a, b) => {
          if (a.dateComite < b.dateComite) return 1;
          if (a.dateComite > b.dateComite) return -1;
          return 0;
        });
        this.comitesStrategie = this.comitesStrategie.slice(0, 4);

        //this.fundComiteStrgComponent?.setComite(this.comitesStrategie);
      }, error: () => {
        this.toastr.error('Erreur de chargement!', 'Comites non chargés!');
      },
      complete: () => (this.loadingComiteStrg = false),
    })
  }

  //Load the fund mandat
  loadMandat(id: any): void {
    this.managementService.findMandats(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.mandats = data;
        this.mandats.forEach((mandat: any) => {
          this.mandat = mandat;
        });
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des mandats :', err);
      },
      complete: () => { },
    })
  }

  //Load the fund secteurs activites
  loadSecteursActivites(id: any): void {
    this.secteurs = [];
    let totalActif = 0;
    this.totalParticipation = 0;
    this.loadingSecteur = true;

    this.managementService
      .findFondsSouscriptionsProjets(id)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data1: any) => {
          data1.fs.forEach(
            (sub: any) => (totalActif += sub.montantSouscription)
          );

          // Extracting the different unique sector from the returned data
          of(...data1.fp.map((p: any) => p.p?.secteurs[0]))
            .pipe(distinct((s: any) => s?.id))
            .subscribe((data: any) => {
              if (data) {
                this.secteurs.push(data);
              }
            });

          // For each sector we will extract the corresponding projects' records from the returned globaldata
          this.secteurs.forEach((s: any) => {
            if (s) {
              s.projets = [];
              s.actif = 0;

              data1.fp
                .filter((p: any) => p.p.secteurs[0]?.id == s?.id)
                .forEach((data2: any) => {
                  data2.actif = 0;

                  // Aggregating treatment for the types of subscriptions
                  [...data2.psa, ...data2.pso, ...data2.psc].forEach(
                    (sub: any) => {
                      s.actif += sub.montant;
                      data2.actif += sub.montant;
                    }
                  );

                  // Convergentions are different, hence treated separately
                  data2.cc.forEach((c: any) => {
                    s.actif -= c.montantPaye;
                    data2.actif -= c.montantPaye;
                  });

                  // Per project part of participation is calculated here in the inner loop
                  data2.part = data2.actif / totalActif;
                  s.projets.push(data2);
                });

              // We calculate the ratio for the sector
              s.part = s.actif / totalActif;

              // Total participation of the fund should be increased by this sector bunch of participations
              this.totalParticipation += s.actif;

              // Making sure that all projects are unique and there is no duplicat
              let uniqueProjects: any[] = [];
              of(...s.projets)
                .pipe(distinct((p: any) => p.p.id))
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe((data: any) => {
                  uniqueProjects.push(data);
                });

              // Sorting projects by names for better lecture
              uniqueProjects.sort((p1: any, p2: any) => {
                if (p1.p.nom > p2.p.nom) return 1;
                if (p1.p.nom < p2.p.nom) return -1;
                return 0;
              });
              s.projets = uniqueProjects;
            }
          });

          // Sorting sectors by names for better lecture
          this.secteurs.sort((s1: any, s2: any) => {
            if (s1.libelle > s2.libelle) return 1;
            if (s1.libelle < s2.libelle) return -1;
            return 0;
          });

          this.secteursData = this.secteurs;
          this.chartData = this.chartSecteursData();
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Secteurs non chargés!');
        },
        complete: () => {
          this.loadingSecteur = false;
        },
      })
  }

  //Generate PDF
  genererPDF() {
    this.fundSheetPdfService.genererPDF(
      this.fundData,
      this.totalActif,
      this.mandat,
      this.souscriptions,
      this.secteurs
    );
  }


  chartSecteursData(): any {
    const categories = this.secteurs.map((s: any) => s.libelle);
    const montantData = this.secteurs.map((s: any) => Number(s.actif));
    const projetsData = this.secteurs.map((s: any) => Array.isArray(s.projets) ? s.projets.length : 0);
    const partData = this.secteurs.map((s: any) => Math.round((Number(s.part) || 0) * 100));

    return {
      categories,
      montantData,
      projetsData,
      partData
    };
  }


  //Navigate to the fund details
  goToEdition() {
    this.router.navigateByUrl(
      '/funds/edition-funds/' + this.fundData.fonds?.id
    );
  }


  getRatio(n: number, m: number): number {
    return Math.round((n / m) * 100);
  }


  equals(a: any, b: any) {
    return a?.fonds?.id == b?.fonds?.id;
  }

  //// color code ////
  getCodeFromColor(color: string): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(color)
      .trim();
  }
}
