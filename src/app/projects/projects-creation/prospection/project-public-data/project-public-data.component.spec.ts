import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectPublicDataComponent } from './project-public-data.component';

describe('ProjectPublicDataComponent', () => {
  let component: ProjectPublicDataComponent;
  let fixture: ComponentFixture<ProjectPublicDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectPublicDataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectPublicDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
