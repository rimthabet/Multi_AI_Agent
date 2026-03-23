import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CcaSettlementCreateFormComponent } from './cca-settlement-create-form.component';

describe('CcaSettlementCreateFormComponent', () => {
  let component: CcaSettlementCreateFormComponent;
  let fixture: ComponentFixture<CcaSettlementCreateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CcaSettlementCreateFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CcaSettlementCreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
