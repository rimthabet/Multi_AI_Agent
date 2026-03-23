import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectsEditionComponent } from './projects-edition.component';

describe('ProjectsEditionComponent', () => {
  let component: ProjectsEditionComponent;
  let fixture: ComponentFixture<ProjectsEditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsEditionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectsEditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
