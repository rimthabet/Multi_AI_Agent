import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectsUnderStudyComponent } from './projects-under-study.component';

describe('ProjectsUnderStudyComponent', () => {
  let component: ProjectsUnderStudyComponent;
  let fixture: ComponentFixture<ProjectsUnderStudyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsUnderStudyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectsUnderStudyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
