import { Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { FinStatementService } from '../../../../../services/fin-statement.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FinancialStatementComponent } from '../../../../projects-study/financial-data/financial-statement/financial-statement.component';

@Component({
  selector: 'cmp',
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, FinancialStatementComponent],
  templateUrl: './cmp.component.html',
  styleUrl: './cmp.component.scss'
})
export class CmpComponent implements OnInit {
  //Inputs
  prospection = input<any>();

  // Injects
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly finStatementService = inject(FinStatementService);


  //PROPERTIES
  yearForm: FormGroup = this.formBuilder.group({
    year: [new Date().getFullYear(), [Validators.required]],
  });

  fin_statements: any[] = Array(1).fill(undefined);
  items: any[] | undefined;
  itemsIndex: Map<string, any> | undefined;

  selectedTab: number = 0;


  //INITIALIZE
  ngOnInit(): void {
    this.yearForm.controls['year'].valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((vakue: any) =>
      this.loadData()
    )

    this.loadData();
  }

  //LOAD DATA
  loadData(): void {
    this.finStatementService.fetchEntities().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        data.forEach((entity: any) => {
          if (entity.code.indexOf('.') < 0) {
            switch (entity.code) {
              case 'CMP':
                this.fin_statements[0] = entity;
                this.fin_statements[0].columns = 3;
                this.fin_statements[0].year = this.yearForm.value['year'] - 1;
                this.fin_statements[0].description = '';
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
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Finances non chargées!');
      }
    })
  }

}
