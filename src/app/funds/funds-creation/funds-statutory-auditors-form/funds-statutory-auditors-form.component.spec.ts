import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsStatutoryAuditorsFormComponent } from './funds-statutory-auditors-form.component';

describe('FundsStatutoryAuditorsFormComponent', () => {
  let component: FundsStatutoryAuditorsFormComponent;
  let fixture: ComponentFixture<FundsStatutoryAuditorsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsStatutoryAuditorsFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsStatutoryAuditorsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
