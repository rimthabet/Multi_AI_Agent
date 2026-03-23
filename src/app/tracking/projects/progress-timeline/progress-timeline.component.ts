import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, inject, Input, input, OnInit, Output, output, SimpleChanges } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import * as _ from 'lodash';

@Component({
  selector: 'progress-timeline',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule
  ],
  templateUrl: './progress-timeline.component.html',
  styleUrl: './progress-timeline.component.scss'
})
export class ProgressTimelineComponent implements OnInit {

  projet = input<any>();
  dataReady = output<any>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);

  loading: boolean = false;
  souscriptions: any = [];

  ngOnInit() {
    this.loadSouscriptions();
  }

  // Load souscriptions
  loadSouscriptions() {
    this.loading = true;

    this.managementService
      .findSouscriptionsByProjet(this.projet()?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {

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

          this.souscriptions = _.groupBy(souscriptions, (p: any) => p.date);
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
        error: () => console.log('error'),
        complete: () => (this.loading = false),
      })
  }

}
