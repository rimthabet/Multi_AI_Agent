import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { KpiBadge01Component } from "../../../../widgets/kpi-badge-01/kpi-badge-01.component";

@Component({
  selector: 'project-promotors',
  imports: [ClarityModule, CdsModule, DatePipe, KpiBadge01Component],
  templateUrl: './project-promotors.component.html',
  styleUrl: './project-promotors.component.scss'
})
export class ProjectPromotorsComponent {
  // inputs
  projet = input<any>();

}
