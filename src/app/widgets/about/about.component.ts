import { Component, inject, model, OnInit } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { environment } from '../../../environment/environment';
import { UiService } from '../../services/ui.service';

@Component({
  selector: 'app-about',
  imports: [ClarityModule, CdsModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss'
})
export class AboutComponent implements OnInit {

  ////DEPENDENCIES 
  private readonly uiService = inject(UiService);

  ////VARIABLES 
  theme: string = 'light';
  open = model<boolean>(false);
  version = environment.version;


  ////ON INIT 
  ngOnInit(): void {
    this.uiService.theme.subscribe((theme) => {
      this.theme = theme;
      console.log('theme', this.theme);
    });
    this.applyTheme();
  }

  ////APPLY THEME 
  applyTheme() {
    this.uiService.setTheme(this.theme);
  }

  ////OPEN ABOUT MODAL 
  openAboutModal() {
    this.open.set(true);
  }

  ////CLOSE ABOUT MODAL 
  closeAboutModal() {
    this.open.set(false);
  }


  ////COPYRIGHT 
  getCopyRight(): string {
    let year = new Date().getFullYear();
    return `Copyright © ${year}-${year + 1}`;
  }
}
