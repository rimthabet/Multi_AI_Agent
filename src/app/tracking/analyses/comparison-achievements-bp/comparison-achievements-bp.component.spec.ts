import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComparisonAchievementsBpComponent } from './comparison-achievements-bp.component';

describe('ComparisonAchievementsBpComponent', () => {
  let component: ComparisonAchievementsBpComponent;
  let fixture: ComponentFixture<ComparisonAchievementsBpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComparisonAchievementsBpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComparisonAchievementsBpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
