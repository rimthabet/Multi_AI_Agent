import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectsCreationComponent } from './projects-creation.component';

describe('ProjectsCreationComponent', () => {
  let component: ProjectsCreationComponent;
  let fixture: ComponentFixture<ProjectsCreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsCreationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectsCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
