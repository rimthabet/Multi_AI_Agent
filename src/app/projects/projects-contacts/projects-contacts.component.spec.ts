import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectsContactsComponent } from './projects-contacts.component';

describe('ProjectsContactsComponent', () => {
  let component: ProjectsContactsComponent;
  let fixture: ComponentFixture<ProjectsContactsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsContactsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectsContactsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
