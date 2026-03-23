import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OcaBankAccountFormComponent } from './oca-bank-account-form.component';

describe('OcaBankAccountFormComponent', () => {
  let component: OcaBankAccountFormComponent;
  let fixture: ComponentFixture<OcaBankAccountFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OcaBankAccountFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OcaBankAccountFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
