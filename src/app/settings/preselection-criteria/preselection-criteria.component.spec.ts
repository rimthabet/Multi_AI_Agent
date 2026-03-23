import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreselectionCriteriaComponent } from './preselection-criteria.component';

describe('PreselectionCriteriaComponent', () => {
  let component: PreselectionCriteriaComponent;
  let fixture: ComponentFixture<PreselectionCriteriaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreselectionCriteriaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreselectionCriteriaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
