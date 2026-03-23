import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Component, EventEmitter, inject, input, Output } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { ClarityModule } from '@clr/angular';
import { FormsModule } from '@angular/forms';
import { CdsButtonModule, CdsIconModule } from '@cds/angular';


@Component({
  selector: 'app-multi-purpose-delete-dialog',
  imports: [ClarityModule, CdsButtonModule, CdsIconModule, FormsModule],
  templateUrl: './multi-purpose-delete-dialog.component.html',
  styleUrl: './multi-purpose-delete-dialog.component.scss'
})
export class MultiPurposeDeleteDialogComponent {

  // Inputs
  pass_phrase = input<string>('');
  warn_message = input<string>('');
  rest_url = input<string>('');
  data = input<{ id: string }>({ id: '' });

  // Output
  @Output() deleteEvent: EventEmitter<any> = new EventEmitter();

  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json; charset=UTF-8',
    }),
  };

  private readonly _httpClient = inject(HttpClient);
  private readonly clipboard = inject(Clipboard);

  // States
  show: boolean = false;
  auth_show: boolean = false;
  authenticated: boolean = false;

  admin_pwd: string | undefined;
  entered_pass_phrase: string | undefined;
  copied: string | undefined;


  display() {
    if (this.authenticated) this.show = true;
    else this.auth_show = true;
  }
  hide() {
    this.show = false;
    this.entered_pass_phrase = undefined;
    this.copied = undefined;
  }

  copyPassPhrase() {
    this.clipboard.copy(this.pass_phrase());
    this.copied = 'Copié';
  }

  delete() {
    let url = this.rest_url() + '/' + this.data()?.id;
    this._httpClient
      .delete(url, this.httpOptions)
      .subscribe(() => this.deleteEvent.emit());
  }

}
