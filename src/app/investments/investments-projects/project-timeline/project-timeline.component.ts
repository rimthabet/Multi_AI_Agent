import { Component, input, OnInit } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'project-timeline',
  imports: [ClarityModule, CdsModule, DatePipe,DecimalPipe],
  templateUrl: './project-timeline.component.html',
  styleUrls: ['./project-timeline.component.scss']
})
export class ProjectTimelineComponent implements OnInit {

  pfa = input<any[]>();
  groupedPfa: any[] = [];

  loading: boolean = false;

  ngOnInit(): void {
    this.loading = true;
    if (!this.pfa()) return;

    const grouped = this.pfa()?.reduce((acc: any, item: any) => {
      const key = item.comiteInvestissement?.financement?.dateDemandeFinancement;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});

    this.groupedPfa = Object.keys(grouped).map((key: any) => {
      let uniqueFonds: any[] = [];
      grouped[key].forEach((item: any) => {
        if (!uniqueFonds.find((fond: any) => fond.comiteInvestissement.fonds.id === item.comiteInvestissement.fonds.id)) {
          uniqueFonds.push(item);
        }
      });
      return { d: key, p: uniqueFonds };
    });

    setTimeout(() => this.loading = false, 100);
  }

}
