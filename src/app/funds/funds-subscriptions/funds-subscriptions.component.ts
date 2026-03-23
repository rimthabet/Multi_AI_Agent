import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  viewChildren,
} from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { environment } from '../../../environment/environment';
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { CdsButtonModule, CdsIconModule, CdsDividerModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { PeriodSubscriptionsComponent } from "./period-subscriptions/period-subscriptions.component";
import { DatePipe } from '@angular/common';
import { KpiBadge01Component } from "../../widgets/kpi-badge-01/kpi-badge-01.component";

@Component({
  selector: 'funds-subscriptions',
  imports: [ClarityModule, CdsButtonModule, CdsIconModule, CdsDividerModule, CommonModule, FormsModule, ReactiveFormsModule, PeriodSubscriptionsComponent, KpiBadge01Component],
  providers: [DatePipe],
  templateUrl: './funds-subscriptions.component.html',
  styleUrls: ['./funds-subscriptions.component.scss'],
})
export class FundsSubscriptionsComponent implements OnInit {

  // Dependencies
  private destroyRef = inject(DestroyRef);
  private managementService = inject(ManagementService);
  private toastr = inject(ToastrService);
  private router = inject(Router);
  private datePipe = inject(DatePipe);

  // Messages
  delete_message: string =
    'Cette opération de suppression est considérée très dangereuse. Elle va induire la suppression de toutes les libérations de cette souscription.';

  subscribers: any[] = [];
  subscriptions: any[] = [];
  wrong_subscriptions: any[] | undefined;

  subscription_periodes: any[] = [];
  prospection_conformite_documentaire: any[] = [];
  liberation_conformite_documentaire: any[] = [];
  fonds: any[] = [];

  per_periode_subscriptions: any[] = [];

  selectedFonds: any | undefined;

  total_souscrit: number = 0;
  total_libere: number = 0;

  loading: boolean = true;


  ngOnInit() {

    // Load the funds list
    this.loadFunds();

    // Load the list of subscribers used only in the add/modif subscription form
    this.loadSubscribers();

    // Load the documents compliances for the subscription bulletin, used in the doc attachment modal
    this.loadComplianceList();

    // Load the documents compliances for the liberation
    this.loadVestingsComplianceList();
  }

  // Load compliance list for vestings
  loadVestingsComplianceList() {
    this.managementService
      .findConformitesByTache(1, 3)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => (this.liberation_conformite_documentaire = data),
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Vestings conformités documentaires non chargées!');
        }
      })
  }

  // Load compliance list 
  loadComplianceList() {
    this.managementService
      .findConformitesByTache(1, 2)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => (this.prospection_conformite_documentaire = data),
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Prospection conformités documentaires non chargées!');
        }
      })
  }

  // Load Subscribers
  loadSubscribers() {
    this.managementService.findSouscripteur()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.subscribers = data.sort((a: any, b: any) => {
            if (a.libelle > b.libelle) return 1;
            if (a.libelle < b.libelle) return -1;
            return 0;
          });
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Souscripteurs non chargés!');
        }
      })
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
    sessionStorage.setItem('LastVisitedFunds', fund.id);
    this.loadSubscriptionsData();
  }

  // Load the subscriptions data
  loadSubscriptionsData() {

    this.loading = true;

    this.managementService
      .findFondsSouscriptionsList(this.selectedFonds.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {

          this.subscriptions = data.souscriptions;
          this.subscription_periodes = data.periodes;

          // Calculer les mauvaises souscriptions hors périodes
          this.wrong_subscriptions = [...this.subscriptions];
          this.subscription_periodes.forEach((sp: any) => {
            const debut = new Date(sp['dateDebut']);
            const fin = new Date(sp['dateFin']);

            this.wrong_subscriptions = this.wrong_subscriptions?.filter(
              (ws: any) =>
                new Date(ws.souscription!['dateSouscription']).getTime() < debut.getTime() ||
                new Date(ws.souscription!['dateSouscription']).getTime() > fin.getTime()
            );
          });

          // Calcul des totaux
          this.total_souscrit = this.subscriptions?.reduce(
            (a: number, b: any) => a + b.souscription.montantSouscription,
            0
          );
          this.total_libere = this.subscriptions?.reduce(
            (a: number, b: any) =>
              a +
              b.liberations?.reduce(
                (a: number, b: any) => a + b.montantLiberation,
                0
              ),
            0
          );
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Subscriptions non chargées!');
        },
        complete: () => {
          this.loading = false;
        },
      });
  }


  // Opens the fiche page
  goToFiche() {
    this.router.navigateByUrl('/dashboard/funds/' + this.selectedFonds?.id);
  }

  // Format date
  public formatDate(date: any, format = 'yyyy-MM-dd'): string | null {
    if (!date) return null;
    if (date.includes?.('/')) {
      const [d, m, y] = date.split('/');
      date = new Date(y, m - 1, d);
    }
    return this.datePipe.transform(date, format);
  }

  // Checks if the two objects are equal
  equals(a: any, b: any) {
    return a?.id == b?.id;
  }
}