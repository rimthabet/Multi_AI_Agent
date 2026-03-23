import { DecimalPipe, PercentPipe } from "@angular/common";
import { Component, input, effect } from "@angular/core";
import { CdsModule } from "@cds/angular";
import { ClarityModule } from "@clr/angular";

@Component({
  selector: 'shareholders-grid',
  imports: [CdsModule, ClarityModule, DecimalPipe, PercentPipe],
  templateUrl: './shareholders-grid.component.html',
  styleUrl: './shareholders-grid.component.scss'
})
export class ShareholdersGridComponent {

  // Inputs
  actionnaires = input<any[]>();
  valeurAction = input<number>(0);
  loading = input<boolean>(true);

  // Déclarations
  actionnairesData: any[] = [];
  total_nombre_action: number = 0;
  total_montant: number = 0;

  actionnairesChangeEffect = effect(() => {
    this.setData(this.actionnaires());
  });

  setData(actionnaires: any) {
    this.actionnairesData = actionnaires;
    this.total_nombre_action = this.actionnairesData?.reduce(
      (total: number, actionnaire: any) =>
        total + actionnaire?.nbrActionsApAugmentation,
      0
    );
    const valeurAction = this.valeurAction?.() ?? 0;
    this.total_montant = this.actionnairesData?.reduce(
      (total: number, actionnaire: any) =>
        total + (actionnaire?.nbrActionsApAugmentation ?? 0) * valeurAction,
      0
    ) ?? 0;
  }
}
