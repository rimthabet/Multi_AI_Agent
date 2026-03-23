import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OcaCreateFormComponent } from './oca-create-form.component';

describe('OcaCreateFormComponent', () => {
  let component: OcaCreateFormComponent;
  let fixture: ComponentFixture<OcaCreateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OcaCreateFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OcaCreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
