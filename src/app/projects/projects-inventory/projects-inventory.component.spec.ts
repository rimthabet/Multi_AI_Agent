import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectsInventoryComponent } from './projects-inventory.component';

describe('ProjectsInventoryComponent', () => {
  let component: ProjectsInventoryComponent;
  let fixture: ComponentFixture<ProjectsInventoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsInventoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectsInventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
