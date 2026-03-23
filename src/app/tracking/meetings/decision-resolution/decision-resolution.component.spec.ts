import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DecisionResolutionComponent } from './decision-resolution.component';

describe('DecisionResolutionComponent', () => {
  let component: DecisionResolutionComponent;
  let fixture: ComponentFixture<DecisionResolutionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DecisionResolutionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DecisionResolutionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
