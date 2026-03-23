import {
  Component,
  effect,
  input,
  viewChild
} from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { CaptitalStructureComponent } from '../../../../projects/projects-creation/financial-study/captital-structure/captital-structure.component';
import { ShareholdersGridComponent } from "./shareholders-grid/shareholders-grid.component";
import { BarChart07Component } from "../../../../widgets/bar-chart-07/bar-chart-07.component";

@Component({
  selector: 'captital-structure-wrapper',
  imports: [CdsModule, ClarityModule, ShareholdersGridComponent, BarChart07Component],
  templateUrl: './captital-structure-wrapper.component.html',
  styleUrl: './captital-structure-wrapper.component.scss'
})
export class CaptitalStructureWrapperComponent extends CaptitalStructureComponent {

  // Inputs
  avantParticipations = input<boolean>(false);

  // ViewChilds
  actionnaireGridComponent = viewChild<ShareholdersGridComponent>("actionnaireGridComponent");
  barChartComponent = viewChild<BarChart07Component>("barChartComponent");

  // Declarations
  projectChangedEffect = effect(() => {
    if (this.prospection()) {
      this.loading = true;
      this.actionnaires = [];
      this.actionnaireGridComponent()?.setData(this.actionnaires);
      this.barChartComponent()?.setData(this.actionnaires);
    }
  });

  selectedFinancementEffect = effect(() => {
    if (this.financement()) {
      this.financementChanged(this.financement());
      this.loadActionnaires();
      this.loading = false;
    }
  });

  // ACTIONNAIRES
  override loadActionnaires() {
    this.loading = true;
    this.managementService
      .findActionnairesByFinancement(this.financement()?.id)
      .subscribe({
        next: (data: any) => {
          if (this.avantParticipations()) {
            data = this.managementService.buildActionnairesAvpList(data, this.financement());
            data.forEach((a: any) => {
              a.nbrActionsApAugmentation = a.nbrActionsAvAugmentation;
            });
          } else {
            data = this.parseHLShareHolders(data);
          }
          this.actionnaires = data;
          this.actionnaireGridComponent()?.setData(this.actionnaires);
          this.barChartComponent()?.setData(this.actionnaires);
        },
        complete: () => (this.loading = false),
      });
  }
}
