import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialStudyComponent } from './financial-study.component';

describe('FinancialStudyComponent', () => {
  let component: FinancialStudyComponent;
  let fixture: ComponentFixture<FinancialStudyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialStudyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialStudyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
