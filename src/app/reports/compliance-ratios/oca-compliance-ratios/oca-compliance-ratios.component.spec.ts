import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OcaComplianceRatiosComponent } from './oca-compliance-ratios.component';

describe('OcaComplianceRatiosComponent', () => {
  let component: OcaComplianceRatiosComponent;
  let fixture: ComponentFixture<OcaComplianceRatiosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OcaComplianceRatiosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OcaComplianceRatiosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
