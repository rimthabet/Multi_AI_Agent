import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialStatementV2Component } from './financial-statement-v2.component';

describe('FinancialStatementV2Component', () => {
  let component: FinancialStatementV2Component;
  let fixture: ComponentFixture<FinancialStatementV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialStatementV2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialStatementV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
