import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectFinancingComponent } from './project-financing.component';

describe('ProjectFinancingComponent', () => {
  let component: ProjectFinancingComponent;
  let fixture: ComponentFixture<ProjectFinancingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectFinancingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectFinancingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
