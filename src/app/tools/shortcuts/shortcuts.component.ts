import { Component, model } from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';

@Component({
  selector: 'app-shortcuts',

  imports: [CdsModule, ClarityModule],
  templateUrl: './shortcuts.component.html',
  styleUrl: './shortcuts.component.scss'
})
export class ShortcutsComponent {

  // ===== MODEL =====
  openShortcuts = model<boolean>(false);

  // OPEN FEEDBACK MODAL
  openShortcutsModal() {
    this.openShortcuts.set(true);
  }
}
