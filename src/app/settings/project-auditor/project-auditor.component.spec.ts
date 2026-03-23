import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectAuditorComponent } from './project-auditor.component';

describe('ProjectAuditorComponent', () => {
  let component: ProjectAuditorComponent;
  let fixture: ComponentFixture<ProjectAuditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectAuditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectAuditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
