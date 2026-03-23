import { CommonModule } from '@angular/common';
import { Component, input, OnInit, output } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule, CdsTextareaModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';

@Component({
  selector: 'app-editable-field',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    CdsTextareaModule,
  ],
  templateUrl: './editable-field.component.html',
  styleUrl: './editable-field.component.scss'
})
export class EditableFieldComponent implements OnInit {

  type = input<'decimal' | 'int' | 'percent' | 'text'>();
  currency = input<string>();
  field = input<any>();
  data = input<any>();
  updateEvent = output<any>();

  control!: FormControl;
  isEditing = false;

  ngOnInit(): void {
    const initialValue = this.data()?.[this.field()] || '';
    this.control = new FormControl(initialValue);
  }

  // activate edit mode
  startEdit() {
    this.isEditing = true;
    this.control.setValue(this.data()?.[this.field()] || '');
  }

  // save changes
  save() {
    if (!this.data() || this.data()[this.field()] === this.control?.value) {
      this.isEditing = false;
      return;
    }

    if (this.data()) {
      this.data()[this.field()] = this.control?.value;
    }
    this.updateEvent.emit(this.data());
    this.isEditing = false;
  }

  // cancel changes
  cancel() {
    this.control?.setValue(this.data()?.[this.field()] || '');
    this.isEditing = false;
  }


  // handle enter key
  onEnter() {
    this.save();
  }

  // handle escape key
  onEscape() {
    this.cancel();
  }
}
