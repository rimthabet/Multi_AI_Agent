import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, input, model, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ManagementService } from '../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UiService } from '../../../../services/ui.service';
import { CiSubscriptionReleaseComponent } from './ci-subscription-release/ci-subscription-release.component';
import { HorizontalScrollerComponent } from "../../../../widgets/horizontal-scroller/horizontal-scroller.component";

@Component({
  selector: 'project-details',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    CiSubscriptionReleaseComponent,
    HorizontalScrollerComponent
  ],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.scss'
})
export class ProjectDetailsComponent implements OnInit {

  //Inputs
  projet = input<any>();
  fonds = input<any>();

  //Dependency injection
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly ui = inject(UiService);

  comitesInvestissement: any[] | undefined;
  loading = model<boolean>(false);

  ngOnInit(): void {
    if (this.projet()) this.setData(this.projet(), this.fonds());
  }

  setData(projet: any, fonds: any): void {

    if (projet && fonds) {
      this.loading.set(true);
      this.managementService.findProjetCIReports(projet.id, this.fonds()?.fonds?.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => { this.comitesInvestissement = data; },
        error: (data: any) => console.log(data),
        complete: () => this.loading.set(false)
      })
    }
  }


}
