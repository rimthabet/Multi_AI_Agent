import { Component, DestroyRef, inject, OnInit, output } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardComponent } from "./dashboard/dashboard.component";
import _ from 'lodash';
import { CaptitalStructureHomeComponent } from './captital-structure-home/captital-structure-home.component';
import { FinancialStatementsWrapperComponent } from "./financial-statements-wrapper/financial-statements-wrapper.component";
import { BusinessPlanWrapperComponent } from "./business-plan-wrapper/business-plan-wrapper.component";
import { firstValueFrom, Subject } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { FinInvSchemasWrapperComponent } from './fin-inv-schemas-wrapper/fin-inv-schemas-wrapper.component';

@Component({
  selector: 'app-project',
  imports: [ClarityModule, CdsModule, DashboardComponent, CaptitalStructureHomeComponent, FinancialStatementsWrapperComponent, BusinessPlanWrapperComponent, FinInvSchemasWrapperComponent],
  templateUrl: './project.component.html',
  styleUrl: './project.component.scss'
})
export class ProjectComponent implements OnInit {

  // outputs
  dataReady = output<any>();

  // dependencies
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  data: any | undefined = null;
  projets: any[] = [];
  financements: any[] = [];
  souscriptions: any = [];

  loading = true;

  isAdmin: boolean = false;
  userRoles: any | undefined;
  profile: any | undefined;

  ngOnInit(): void {
    let id = this.activatedRoute.snapshot.paramMap.get('id');
    this.loadProjet(Number(id));
    this.loadData();
  }

  //Load projet
  async loadProjet(id: number) {
    this.loading = true;

    // Create a subject to signal when the subscription is complete
    const done$ = new Subject<void>();

    // Load the projet
    this.managementService.findProjetPublicDataById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (projetData: any) => this.data = {
        ...projetData
      },
      complete: () => {

        // Signal that the subscription is complete
        this.loading = false;
        done$.next();
        done$.complete();
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Projet non chargé!');
      }
    })

    // Wait for the subscription to complete
    await firstValueFrom(done$);
    this.loadSouscriptions();
  }

  //Load data
  loadData() {
    this.loading = true;
    this.managementService.findProjets().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.projets = data;

        if (this.profile?.attributes?.projets.length > 0) {
          this.projets = this.projets.filter((projet: any) =>
            this.profile?.attributes?.projets.includes(projet.id.toString())
          );
        }

        this.projets.sort((p1: any, p2: any) => {
          if (p1.nom > p2.nom) return 1;
          if (p1.nom < p2.nom) return -1;
          return 0;
        });
      },
      complete: () => {
        this.loading = false;
      },
    })

  }

  //Load souscriptions
  loadSouscriptions() {
    this.loading = true;

    this.managementService
      .findSouscriptionsByProjet(this.data?.projet?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          // if (data == null) return;

          let souscriptions = data?.psa.map((sa: any) => {
            return {
              p: sa.financement?.projet,
              date: sa.dateBulletin,
              fonds: sa.fonds,
              montant: sa.montant,
              actions: sa.actions,
              nominal: sa.nominal,
              type: 'Actions',
            };
          });

          souscriptions = [
            ...souscriptions,
            ...data?.pso.map((so: any) => {
              return {
                p: so.financement?.projet,
                date: so.dateBulletin,
                fonds: so.fonds,
                montant: so.montant,
                actions: so.nombreOCA,
                nominal: so.nominal,
                type: 'OCA',
              };
            }),
          ];

          souscriptions = [
            ...souscriptions,
            ...data?.psc.map((sc: any) => {
              return {
                p: sc.financement?.projet,
                date: sc.dateSignatureContrat,
                fonds: sc.fonds,
                montant: sc.montant,
                actions: null,
                nominal: null,
                type: 'CCA',
              };
            }),
          ];

          this.souscriptions = _.groupBy(souscriptions, (p) => p.date);
          this.souscriptions = Object.keys(this.souscriptions).map(
            (key: any) => {
              let uniqueFonds: any[] = [];
              this.souscriptions[key].forEach((item: any) => {
                if (
                  !uniqueFonds.find(
                    (fond: any) => fond.fonds.id == item.fonds.id
                  )
                ) {
                  uniqueFonds.push(item);
                }
              });
              return { d: key, p: uniqueFonds };
            }
          );

          this.souscriptions.sort((s1: any, s2: any) => {
            if (s1.d > s2.d) return -1;
            if (s1.d < s2.d) return 1;
            return 0;
          });
          this.dataReady?.emit(this.souscriptions);

        },
        complete: () => (this.loading = false),
      })
  }

  genererPDF(id: number) {

  }

  goToFiche() {
    this.router.navigateByUrl(
      '/projects/edition/' + this.data.projet?.id
    );
  }

}
