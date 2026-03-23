import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectProgressStatusComponent } from './project-progress-status.component';

describe('ProjectProgressStatusComponent', () => {
  let component: ProjectProgressStatusComponent;
  let fixture: ComponentFixture<ProjectProgressStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectProgressStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectProgressStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
