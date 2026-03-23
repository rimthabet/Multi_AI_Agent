import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectLitigationFormComponent } from './project-litigation-form.component';

describe('ProjectLitigationFormComponent', () => {
  let component: ProjectLitigationFormComponent;
  let fixture: ComponentFixture<ProjectLitigationFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectLitigationFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectLitigationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
