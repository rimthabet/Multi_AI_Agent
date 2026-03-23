import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeneralDirectorFormComponent } from './general-director-form.component';

describe('GeneralDirectorFormComponent', () => {
  let component: GeneralDirectorFormComponent;
  let fixture: ComponentFixture<GeneralDirectorFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneralDirectorFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeneralDirectorFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
