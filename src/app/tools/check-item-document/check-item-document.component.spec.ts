import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckItemDocumentComponent } from './check-item-document.component';

describe('CheckItemDocumentComponent', () => {
  let component: CheckItemDocumentComponent;
  let fixture: ComponentFixture<CheckItemDocumentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckItemDocumentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckItemDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
