import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComparisonInvestmentAchievementSchemeComponent } from './comparison-investment-achievement-scheme.component';

describe('ComparisonInvestmentAchievementSchemeComponent', () => {
  let component: ComparisonInvestmentAchievementSchemeComponent;
  let fixture: ComponentFixture<ComparisonInvestmentAchievementSchemeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComparisonInvestmentAchievementSchemeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComparisonInvestmentAchievementSchemeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
