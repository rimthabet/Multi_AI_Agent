import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTrackingMilestonesComponent } from './project-tracking-milestones.component';

describe('ProjectTrackingMilestonesComponent', () => {
  let component: ProjectTrackingMilestonesComponent;
  let fixture: ComponentFixture<ProjectTrackingMilestonesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTrackingMilestonesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTrackingMilestonesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
