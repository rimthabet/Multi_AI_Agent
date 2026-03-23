import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiPurposeDeleteDialogComponent } from './multi-purpose-delete-dialog.component';

describe('MultiPurposeDeleteDialogComponent', () => {
  let component: MultiPurposeDeleteDialogComponent;
  let fixture: ComponentFixture<MultiPurposeDeleteDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiPurposeDeleteDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultiPurposeDeleteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
