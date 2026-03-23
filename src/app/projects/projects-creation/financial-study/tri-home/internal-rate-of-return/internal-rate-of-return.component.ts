import { Component, DestroyRef, effect, inject, input, viewChild } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FinStatementService } from '../../../../../services/fin-statement.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TriCapitalComponent } from "./tri-capital/tri-capital.component";
import { CapitalIrrComponent } from "./capital-irr/capital-irr.component";
import { OcaIrrComponent } from "./oca-irr/oca-irr.component";

@Component({
  selector: 'internal-rate-of-return',
  imports: [CdsModule, ClarityModule, CapitalIrrComponent, OcaIrrComponent],
  templateUrl: './internal-rate-of-return.component.html',
  styleUrl: './internal-rate-of-return.component.scss'
})
export class InternalRateOfReturnComponent {
  prospection = input<any>();
  financement = input<any>();
  participation = input<any>();
  fonds = input<any>();
  valorisationAction = input<any>();

  // ===== VIEW CHILD =====
  tri_capital = viewChild<TriCapitalComponent>("tri_capital");


  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly finStatementService = inject(FinStatementService);


  // ===== PROPERTIES =====
  bps: any[] = [];


  // ===== INIZIALIZATION =====
  ngOnInit(): void {
    this.loadBPs();
  }


  // ===== EFFECTS =====
  readonly participationEffect = effect(() => {
    if (this.participation()) {
      this.loadBPs();
    }
  });



  // ===== BPS =====
  loadBPs() {
    this.finStatementService
      .fetchBPs(this.prospection()?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.bps = data;
        },
        error: (error) => {
        }
      })
  }



}
