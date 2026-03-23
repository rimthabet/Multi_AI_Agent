import { Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { FinStatementService } from '../../../../../services/fin-statement.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClrNumberInputModule } from "@clr/angular";
import { FinancialStatementComponent } from '../../../../projects-study/financial-data/financial-statement/financial-statement.component';

@Component({
  selector: 'dcf',
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, FinancialStatementComponent, ClrNumberInputModule],
  templateUrl: './dcf.component.html',
  styleUrl: './dcf.component.scss'
})
export class DcfComponent implements OnInit {
  //Inputs
  prospection = input<any>();

  // Injects
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly finStatementService = inject(FinStatementService);


  //Properties
  yearForm: FormGroup = this.formBuilder.group({
    year: [new Date().getFullYear(), [Validators.required]],
    nb_years: [3],
    bp: [0],
  });

  fin_statements: any[] = Array(5).fill(undefined);
  items: any[] | undefined;
  itemsIndex: Map<string, any> | undefined;
  bps: any[] | undefined;

  selectedTab: number = 0;
  loading: boolean = false;

  //INITIALIZE
  ngOnInit(): void {
    this.yearForm.controls['year'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value: any) =>
      this.loadData()
    )
    this.yearForm.controls['nb_years'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value: any) =>
      this.loadData()
    );
    this.yearForm.controls['bp'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value: any) =>
      this.loadData()
    );

    this.loadBPs();
    this.loadData();
  }

  //LOAD DATA BPS
  loadBPs() {
    this.loading = true;
    this.finStatementService.fetchBPs(this.prospection().id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.bps = data;
      },

      complete: () => (this.loading = false),
    })
  }

  //LOAD DATA
  loadData(): void {
    this.loading = true;
    this.finStatementService.fetchEntities().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        data.forEach((entity: any) => {
          if (entity.code.indexOf('.') < 0) {
            switch (entity.code) {
              case 'BFR':
                this.fin_statements[0] = entity;
                this.fin_statements[0].columns =
                  this.yearForm.value['nb_years'];
                this.fin_statements[0].year = this.yearForm.value['year'] - 1;
                this.fin_statements[0].description =
                  'Le BFR, ou Besoin en Fonds de Roulement (en anglais, Working Capital Requirement - WCR),' +
                  "est une mesure financière essentielle pour évaluer la santé financière d'une entreprise et sa capacité à gérer ses opérations courantes.";
                break;

              case 'BFRPRV':
                this.fin_statements[1] = entity;
                this.fin_statements[1].columns = 6;
                this.fin_statements[1].year = this.yearForm.value['year'] + 5;
                this.fin_statements[1].description =
                  'Le BFR prévisionnel, également connu sous le nom de Besoin en Fonds de Roulement Prévisionnel ' +
                  "(ou Forecasted Working Capital Requirement en anglais), fait référence à une estimation future du besoin en fonds de roulement d'une entreprise. ";
                break;

              case 'FCF':
                this.fin_statements[2] = entity;
                this.fin_statements[2].columns = 5;
                this.fin_statements[2].year = this.yearForm.value['year'] + 5;
                this.fin_statements[2].description =
                  'FCF, ou Flux de Trésorerie Disponible (en anglais, Free Cash Flow - FCF), ' +
                  "est une mesure financière essentielle qui représente la quantité d'argent disponible après avoir couvert " +
                  'les dépenses nécessaires pour maintenir et développer une entreprise. ';
                break;

              case 'CMPC':
                this.fin_statements[3] = entity;
                this.fin_statements[3].columns = 1;
                this.fin_statements[3].year = this.yearForm.value['year'];
                this.fin_statements[3].description =
                  'Le CMPC, ou Coût Moyen Pondéré du Capital (en anglais, Weighted Average Cost of Capital - WACC), ' +
                  "est un concept financier fondamental utilisé pour évaluer la rentabilité d'un projet d'investissement ou d'une entreprise.";
                break;

              case 'DCF':
                this.fin_statements[4] = entity;
                this.fin_statements[4].columns = 5;
                this.fin_statements[4].year = this.yearForm.value['year'] + 5;
                this.fin_statements[4].description =
                  'Le Discounted Cash Flow (DCF) est une méthode d’analyse utilisée ' +
                  "pour évaluer la valeur d'une entreprise. On la traduit généralement " +
                  'en français par « flux de trésorerie actualisés ».';
                break;
            }
          }
        });

        // Indexing the items
        this.itemsIndex = new Map(data.map((i: any) => [i.code, i]));

        // Setting valued Items
        data.forEach((i: any) => {
          if (this.itemsIndex?.get(i.code + '.1') == undefined) i.leaf = true;
          else i.leaf = false;
        });

        // We need to have the ordering of the items
        this.finStatementService.sortItems(data);
        this.items = data;
      },
      complete: () => (this.loading = false),
    })

  }


}
