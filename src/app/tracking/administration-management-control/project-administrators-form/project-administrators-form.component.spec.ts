import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectAdministratorsFormComponent } from './project-administrators-form.component';

describe('ProjectAdministratorsFormComponent', () => {
  let component: ProjectAdministratorsFormComponent;
  let fixture: ComponentFixture<ProjectAdministratorsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectAdministratorsFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectAdministratorsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
