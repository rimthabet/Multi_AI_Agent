import { CurrencyPipe } from '@angular/common';
import {
  Component,
  input,
  output,
  viewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CdsButtonModule, CdsIconModule, CdsDropdownModule, CdsDividerModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { KpiBadge01Component } from "../../../widgets/kpi-badge-01/kpi-badge-01.component";
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { LitigationViewComponent } from "../../projects-litigation/litigation-view/litigation-view.component";
import { ProjectLitigationFormComponent } from "../../projects-litigation/project-litigation-form/project-litigation-form.component";

@Component({
  selector: 'project-card',
  imports: [ClarityModule, CdsButtonModule, CdsIconModule, CdsDropdownModule, CurrencyPipe, RouterModule, KpiBadge01Component, CdsDividerModule, FullCalendarModule, LitigationViewComponent, ProjectLitigationFormComponent],
  templateUrl: './project-card.component.html',
  styleUrls: ['./project-card.component.scss'],
})
export class ProjectCardComponent {

  // Input
  project = input<any>();

  // Output 
  openEtatChangePopup = output<any>();
  deleteEventEmitter = output<any>();

  // View child
  calendarComponent = viewChild.required<FullCalendarComponent>("calendar");


  // State
  showLitigationWizard: boolean = false;
  showLitigationView: boolean = false;
  hasLitigationCase: boolean = false;


  ///THEME
  themeColor(): string {
    return localStorage.getItem('cds-theme') || 'light';
  }

  ///EVENTS
  showEtatChangeMondel() {
    this.openEtatChangePopup.emit(this.project()?.projet);
  }

  deleteProject() {
    this.deleteEventEmitter.emit(this.project()?.projet);
  }

  ///METHODS
  criteresPreselection(): string {
    return this.project()?.projet?.criteresPreselection?.reduce((acc: string, c: any) => acc + c.libelle + ', ', '');
  }

  checkoutFunds(): string {
    let funds = '';
    this.project()?.financements?.forEach((financement: any) => {
      financement?.fonds?.forEach((f: any) => {
        funds += f?.denomination + ', ';
      });
    });
    return funds;
  }


}