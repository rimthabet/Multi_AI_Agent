import { Component, input } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { OcaCreateFormComponent } from "./oca-create-form/oca-create-form.component";
import { CcaCreateFormComponent } from "./cca-create-form/cca-create-form.component";
import { SharesCreateFormComponent } from "./shares-create-form/shares-create-form.component";

@Component({
  selector: 'funds-subscription',

  imports: [ClarityModule, CdsModule, OcaCreateFormComponent, CcaCreateFormComponent, SharesCreateFormComponent],
  templateUrl: './funds-subscription.component.html',
  styleUrl: './funds-subscription.component.scss'
})
export class FundsSubscriptionComponent {

  // ===== INPUT =====
  projet = input<any>();
  fonds = input<any>();
  financement = input<any>();

  // ===== PROPERTIES =====
  isPanelOpen = true;

}
