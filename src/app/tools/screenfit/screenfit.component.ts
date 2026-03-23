import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';

@Component({
  selector: 'screenfit',
  standalone: true,
  imports: [ClarityModule, CdsModule],
  templateUrl: './screenfit.component.html',
  styleUrls: ['./screenfit.component.scss'],
})
export class ScreenfitComponent implements OnInit {
  @Input() openScreenFit: boolean = false;
  @Output() closeEvent = new EventEmitter<boolean>();

  constructor(private router: Router) { }

  ngOnInit(): void {
    if (this.openScreenFit) {
      this.fullScreen();
    }
  }

  ngOnChanges(): void {
    if (this.openScreenFit) {
      this.fullScreen();
    }
  }

  fullScreen() {
    let elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }

    this.close();
    // setTimeout(() => this.router.navigateByUrl('/dashboard/'), 500);
  }

  close() {
    this.closeEvent.emit(false);
  }
}
