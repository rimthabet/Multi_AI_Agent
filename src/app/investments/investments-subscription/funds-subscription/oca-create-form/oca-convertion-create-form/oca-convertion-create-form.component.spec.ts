import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OcaConvertionCreateFormComponent } from './oca-convertion-create-form.component';

describe('OcaConvertionCreateFormComponent', () => {
  let component: OcaConvertionCreateFormComponent;
  let fixture: ComponentFixture<OcaConvertionCreateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OcaConvertionCreateFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OcaConvertionCreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
