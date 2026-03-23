import { Component, DestroyRef, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdsButtonModule, CdsIconModule, CdsDividerModule } from '@cds/angular';
import { GoogleMapsModule } from '@angular/google-maps';
import { InventoryFundsComponent } from './inventory-funds/inventory-funds.component';
import { ManagementService } from '../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BarChart11Component } from '../widgets/bar-chart-11/bar-chart-11.component';
import { FundsInvestmentComponent } from './funds-investment/funds-investment.component';
import { ProjectGeolocationComponent } from './project-geolocation/project-geolocation.component';
import { BarChart12Component } from '../widgets/bar-chart-12/bar-chart-12.component';
import { BarChart13Component } from '../widgets/bar-chart-13/bar-chart-13.component';
import { ClrAlertModule } from '@clr/angular';
import { FundsAssetsComponent } from './funds-assets/funds-assets.component';
import { GlobalKpisComponent } from './global-kpis/global-kpis.component';
import { BarChart14Component } from '../widgets/bar-chart-14/bar-chart-14.component';
import { BarChart15Component } from '../widgets/bar-chart-15/bar-chart-15.component';
import { FundsDivestmentComponent } from './funds-divestment/funds-divestment.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [
    CommonModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    GoogleMapsModule,
    InventoryFundsComponent,
    BarChart11Component,
    FundsInvestmentComponent,
    ProjectGeolocationComponent,
    BarChart12Component,
    BarChart13Component,
    ClrAlertModule,
    FundsAssetsComponent,
    GlobalKpisComponent,
    BarChart14Component,
    BarChart15Component,
    FundsDivestmentComponent,
  ],
})
export class DashboardComponent implements AfterViewInit {
  //Injects
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);

  //Variables
  loadingFonds: boolean = true;
  loadingProjets: boolean = true;
  loadingFundStats: boolean = true;
  loadingSubscriptions: boolean = true;
  loadingFundsDivestment: boolean = true;

  fonds: any[] = [];
  projets: any[] = [];
  activeProjects: any[] = [];
  funds_divestment: any[] = [];
  funds_assets_investments: any[] = [];
  stats_by_badge_range: any[] = [];
  projects_by_year_and_status: any[] = [];

  total_investi_actions: number = 0;
  total_investi_cca: number = 0;
  total_investi_oca: number = 0;
  total_actif = 0;

  liquiditeActifs: Map<string, any> = new Map();
  liquiditeActifsFunds: any[] = [];

  subscriptions: any[] = [];

  // Lifecycle hook
  ngAfterViewInit(): void {
    this.loadFonds();
    this.loadProjets();
    this.loadSubscriptions();
    this.loadFundsDivestment();
  }

  /// Fonds
  loadFonds() {
    this.loadingFonds = true;
    this.managementService
      .findFonds()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.fonds = data;
          this.fonds.sort((f1: any, f2: any) => {
            if (f1.fonds?.dateLancement < f2.fonds?.dateLancement) return 1;
            if (f1.fonds?.dateLancement > f2.fonds?.dateLancement) return -1;
            return 0;
          });
          this.loadFundStats();
        },
        complete: () => {
          this.loadingFonds = false;
        },
      });
  }

  /// Projets
  /// Projets
  loadProjets() {
    this.loadingProjets = true;

    this.managementService
      .findProjetWithFinancement()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          console.log('data projets', data);
          data?.sort((a: any, b: any) =>
            (a.projet?.nom as string) > (b.projet?.nom as string)
              ? 1
              : (a.projet?.nom as string) < (b.projet?.nom as string)
              ? -1
              : 0
          );
          this.projets = data;
          this.activeProjects = [...data].filter((p: any) => {
            const etat = p.projet?.etatAvancement?.libelle?.toLowerCase();
            return (
              etat?.indexOf('abandon') === -1 && etat?.indexOf('rejeté') === -1
            );
          });

          console.debug(this.activeProjects.map((p) => p.projet?.nom));

          const yearMap: Record<
            string,
            Record<string, { etat: string; couleur: string; count: number }>
          > = {};

          const projetsSansDateAffectation = this.projets.filter(
            (p) => !p.projet?.dateAffectation
          );

          console.log(
            'Projets avec dateAffectation = null :',
            projetsSansDateAffectation
          );

          this.projets.forEach(({ projet }: any) => {
            const year = projet.dateAffectation
              ? new Date(projet.dateAffectation).getFullYear().toString()
              : 'N/A';

            const status = projet.etatAvancement?.libelle;
            const couleur = projet.etatAvancement?.couleur;

            if (!status) return;

            yearMap[year] ??= {};
            yearMap[year][status] ??= {
              etat: status,
              couleur: couleur,
              count: 0,
            };
            yearMap[year][status].count++;
          });

          this.projects_by_year_and_status = Object.entries(yearMap)
            .map(([annee, etats]) => ({
              annee,
              etats: Object.values(etats),
            }))
            .sort((a: any, b: any) => +a.annee - +b.annee);
        },
        complete: () => {
          this.loadingProjets = false;
        },
      });
  }

  // Load fund stats
  loadFundStats() {
    this.loadingFundStats = true;

    this.liquiditeActifs.clear();

    this.liquiditeActifsFunds = [];

    this.total_investi_actions = 0;
    this.total_investi_cca = 0;
    this.total_investi_oca = 0;
    this.total_actif = 0;

    // V2 we are calling the fonds-reports stats routine
    this.managementService
      .findStats(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.funds_assets_investments = data;
          let fundsInvestmentsStats: Map<
            number,
            {
              fund: any;
              assets: number;
              invA: number;
              invO: number;
              invC: number;
            }
          > = new Map();

          // Filling with assets
          data.souscriptions?.forEach((item: any) => {
            const fund = item.fonds;
            const assets = item.montantSouscription;

            let record = fundsInvestmentsStats.get(fund?.id);
            if (!record) {
              record = { fund, assets: 0, invA: 0, invC: 0, invO: 0 };
              fundsInvestmentsStats.set(fund?.id, record);
            }
            record.assets += assets;
            fundsInvestmentsStats.set(fund?.id, record);
          });

          // Filling with RegelementsCCA
          data.regelementsCCA?.forEach((item: any) => {
            const fund = item.souscription?.fonds;
            const assets = item.montantPaye;

            let record = fundsInvestmentsStats.get(fund?.id);
            if (!record) {
              record = { fund, assets: 0, invA: 0, invC: 0, invO: 0 };
              fundsInvestmentsStats.set(fund?.id, record);
            }
            record.assets += assets;
            fundsInvestmentsStats.set(fund?.id, record);
          });

          const statsByRange = new Map([
            [
              'lt_100_mDT',
              { amount: 0, projects: new Set(), range: '< 100 mDT' },
            ],
            [
              'bet_100_500_mDT',
              { amount: 0, projects: new Set(), range: '100 - 500 mDT' },
            ],
            [
              'bet_500_mDT_1MDT',
              { amount: 0, projects: new Set(), range: '500 mDT - 1 MDT' },
            ],
            [
              'bet_1_2_MDT',
              { amount: 0, projects: new Set(), range: '1 MDT - 2 MDT' },
            ],
            ['mt_3_MDT', { amount: 0, projects: new Set(), range: '+ 3 MDT' }],
          ]);

          // Util rootines`
          const categorize = (m: number) =>
            m < 100000
              ? 'lt_100_mDT'
              : m < 500000
              ? 'bet_100_500_mDT'
              : m < 1000000
              ? 'bet_500_mDT_1MDT'
              : m < 2000000
              ? 'bet_1_2_MDT'
              : 'mt_3_MDT';

          // Filling with invA
          data.invLiberationsActions?.forEach((item: any) => {
            const fund = item.souscription?.fonds;
            const assets = item.montantLiberation;

            let record = fundsInvestmentsStats.get(fund?.id);
            if (!record) {
              record = { fund, assets: 0, invA: 0, invC: 0, invO: 0 };
              fundsInvestmentsStats.set(fund?.id, record);
            }
            record.invA += assets;
            fundsInvestmentsStats.set(fund?.id, record);

            let categ = categorize(assets);
            statsByRange.get(categ)!.amount += assets;
            statsByRange.get(categ)!.projects.add(fund);
          });

          // Filling with invO
          data.invLiberationsOCA?.forEach((item: any) => {
            const fund = item.souscription?.fonds;
            const assets = item.montantLiberation;

            let record = fundsInvestmentsStats.get(fund?.id);
            if (!record) {
              record = { fund, assets: 0, invA: 0, invC: 0, invO: 0 };
              fundsInvestmentsStats.set(fund?.id, record);
            }
            record.invO += assets;
            fundsInvestmentsStats.set(fund?.id, record);

            let categ = categorize(assets);
            statsByRange.get(categ)!.amount += assets;
            statsByRange.get(categ)!.projects.add(fund);
          });

          // Filling with invC
          data.invLiberationsCCA?.forEach((item: any) => {
            const fund = item.souscription?.fonds;
            const assets = item.montantLiberation;

            let record = fundsInvestmentsStats.get(fund?.id);
            if (!record) {
              record = { fund, assets: 0, invA: 0, invC: 0, invO: 0 };
              fundsInvestmentsStats.set(fund?.id, record);
            }
            record.invC += assets;
            fundsInvestmentsStats.set(fund?.id, record);

            let categ = categorize(assets);
            statsByRange.get(categ)!.amount += assets;
            statsByRange.get(categ)!.projects.add(fund);
          });

          this.stats_by_badge_range = Array.from(statsByRange.values());

          this.liquiditeActifsFunds = Array.from(
            fundsInvestmentsStats.values()
          ).map((item: any) => {
            const totalActifFonds = item.assets;
            const actifInvesti = item.invA + item.invC + item.invO;
            const resteAInvestir = Math.max(
              0,
              item.assets * item.fund?.ratioReglementaire - actifInvesti
            );
            return {
              fonds: item.fund,
              totalActif: totalActifFonds,
              actifInvesti,
              resteAInvestir,
              invA: item.invA,
              invO: item.invO,
              invC: item.invC,
            };
          });
        },
        error: (error) => console.error('Erreur stats fonds', error),
        complete: () => (this.loadingFundStats = false),
      });
  }

  /// Subscriptions
  loadSubscriptions() {
    this.loadingSubscriptions = true;
    this.managementService
      .findAllSubscriptions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          data = data.filter((sub: any) => sub != undefined);
          this.subscriptions = data;
        },
        error: (error) => console.error('Erreur subscriptions', error),
        complete: () => (this.loadingSubscriptions = false),
      });
  }

  /// Funds divestment
  loadFundsDivestment() {
    this.loadingFundsDivestment = true;
    this.managementService
      .findInvSoucriptionAction()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.funds_divestment = data;
        },
        error: (error) => console.error('Erreur funds divestment', error),
        complete: () => (this.loadingFundsDivestment = false),
      });
  }
}
