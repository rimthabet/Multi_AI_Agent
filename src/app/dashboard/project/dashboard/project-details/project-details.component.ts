import { Component, input } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { CurrencyPipe } from '@angular/common';
import { DatePipe } from '@angular/common';
import { KpiBadge01Component } from "../../../../widgets/kpi-badge-01/kpi-badge-01.component";

@Component({
  selector: 'project-details',  
  imports: [ClarityModule, CdsModule, CurrencyPipe, DatePipe, KpiBadge01Component],
  templateUrl: './project-details.component.html',
  styleUrl: './project-details.component.scss'
})
export class ProjectDetailsComponent {
  projet = input<any>();

}
