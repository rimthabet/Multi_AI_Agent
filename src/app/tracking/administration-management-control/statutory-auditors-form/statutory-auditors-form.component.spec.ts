import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatutoryAuditorsFormComponent } from './statutory-auditors-form.component';

describe('StatutoryAuditorsFormComponent', () => {
  let component: StatutoryAuditorsFormComponent;
  let fixture: ComponentFixture<StatutoryAuditorsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatutoryAuditorsFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatutoryAuditorsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
