import { Component, DestroyRef, inject, model, OnInit } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { DatePipe, DecimalPipe } from '@angular/common';
import { PercentPipe } from '@angular/common';
import { ManagementService } from '../../services/management.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { _ } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { KpiBadge01Component } from "../../widgets/kpi-badge-01/kpi-badge-01.component";

@Component({
  selector: 'subscriber-subscriptions',
  imports: [ClarityModule, CdsModule, DecimalPipe, DatePipe, PercentPipe, DecimalPipe, FormsModule,
    ReactiveFormsModule, KpiBadge01Component],
  templateUrl: './funds-subscriber-subscriptions.component.html',
  styleUrl: './funds-subscriber-subscriptions.component.scss'
})
export class FundsSubscriberSubscriptionsComponent implements OnInit {

  data = model<any[]>([]);

  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);

  selectedFund: any | undefined;
  selected_fund_subscriptions_total_amount: number = 0;
  selected_fund_liberations_total_amount: number = 0;

  fonds: any = [];
  loading: boolean = true;

  ngOnInit() {

    // Load the funds list
    this.loadFonds();
  }

  // Switch the fund
  switchTheFund(f: any) {
    this.selectedFund = f;
    this.loadFundData();
    sessionStorage.setItem('LastVisitedFunds', f.id);
  }

  // Load the funds list
  loadFonds() {
    this.managementService.findFondsList()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.fonds = data;
          let lastVisitedFunds = sessionStorage.getItem('LastVisitedFunds');

          if (lastVisitedFunds) {
            let selectedFond = this.fonds.find(
              (fond: any) => fond.id == lastVisitedFunds
            );

            if (selectedFond) {
              this.selectedFund = selectedFond;
            } else {
              this.selectedFund = data[0];
              sessionStorage.setItem('LastVisitedFunds', data[0].id);
            }
          } else {
            this.selectedFund = data[0];
            sessionStorage.setItem('LastVisitedFunds', data[0].id);
          }

          this.switchTheFund(this.selectedFund);
        },
        error: (error) => console.error(error)
      })
  }


  // On change selected fond
  onChange($event: any) {
    this.selectedFund = $event;
    this.loadFundData();
  }


  // Load data for the selected fund
  loadFundData() {
    this.loading = true;
    this.managementService
      .subscriptionsBySubscriber(
        this.selectedFund.id
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.data.set(res?.souscriptions);

          // Ne garder que les souscriptions ayant un souscripteur
          this.data.set(this.data().filter(
            (s: any) => s?.souscription?.souscripteur
          ));

          // Totaux globaux
          this.selected_fund_subscriptions_total_amount = this.data().reduce(
            (a: number, b: any) => a + b?.souscription?.montantSouscription,
            0
          );
          this.selected_fund_liberations_total_amount = this.data().reduce(
            (a: number, b: any) =>
              a +
              b.liberations?.reduce(
                (a: number, b: any) => a + b.montantLiberation,
                0
              ),
            0
          );

          // Groupement par souscripteur sans lodash
          const groupedMap: { [key: string]: any[] } = {};
          this.data().forEach((item: any) => {
            const key = item.souscription?.souscripteur?.libelle;
            if (!groupedMap[key]) {
              groupedMap[key] = [];
            }
            groupedMap[key].push(item);
          });

          const groupedBySouscripteur = Object.entries(groupedMap).map(
            ([key, value]) => ({
              souscripteur: key,
              souscriptions: value,
              ...value[0]?.souscription?.souscripteur,
            })
          );

          // Traitement de chaque groupe
          this.data.set(groupedBySouscripteur);
          this.data().forEach((s: any) => {
            s.totalMontantSouscription = s.souscriptions?.reduce(
              (a: number, b: any) => a + b.souscription?.montantSouscription,
              0
            );

            s.souscriptions = s.souscriptions?.map((s: any) => ({
              ...s,
              montantLibere: s.liberations?.reduce(
                (a: number, b: any) => a + b?.montantLiberation,
                0
              ),
            }));

            s.totalMontantLibere = s.souscriptions?.reduce(
              (a: number, b: any) => a + b?.montantLibere,
              0
            );

            s.liberationsCount = s.souscriptions?.reduce(
              (a: number, b: any) => a + (b?.liberations?.length || 0),
              0
            );
          });
        },
        error: () => {
          console.log('Error loading data');
        },
        complete: () => {
          this.loading = false;
        },
      })
  }


  goToFiche() {
    this.router.navigateByUrl('/dashboard/funds/' + this.selectedFund?.id);
  }

  equals(a: any, b: any) {
    return a?.id == b?.id;
  }
}
