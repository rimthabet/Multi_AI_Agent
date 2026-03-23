import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContributionTypesComponent } from './contribution-types.component';

describe('ContributionTypesComponent', () => {
  let component: ContributionTypesComponent;
  let fixture: ComponentFixture<ContributionTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContributionTypesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContributionTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
