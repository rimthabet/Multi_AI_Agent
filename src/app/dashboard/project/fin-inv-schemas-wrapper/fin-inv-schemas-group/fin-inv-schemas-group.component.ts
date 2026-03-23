import { AfterViewInit, Component, DestroyRef, inject, input, model } from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ManagementService } from '../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { FinInvSchemaComponent } from './fin-inv-schema/fin-inv-schema.component';
import { KpiBadge01Component } from "../../../../widgets/kpi-badge-01/kpi-badge-01.component";

@Component({
  selector: 'fin-inv-schemas-group',
  imports: [CdsModule, ClarityModule, FinInvSchemaComponent, KpiBadge01Component],
  templateUrl: './fin-inv-schemas-group.component.html',
  styleUrl: './fin-inv-schemas-group.component.scss'
})
export class FinInvSchemasGroupComponent implements AfterViewInit {

  /// INPUTS
  financement = input<any>();
  totalInvestissement = model<number>(0);
  totalFinancing = model<number>(0);
  loading = model<boolean>(false);

  /// DEPENDENCIES
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);

  // Local attributes
  scifs: any[] = [];

  /// INIT
  ngAfterViewInit(): void {
    this.loadScifs();
  }

  /// LOAD SCIFS
  loadScifs(): void {
    this.loading.set(true);
    this.managementService
      .findSchemaInvFinByFin(this.financement()?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.scifs = data;
        },
        complete: () => {
          this.loading.set(false);
        },
        error: (err) => {
          this.toastr.error(err?.message || 'Erreur de chargement des schémas');
        },
      });
  }

}


