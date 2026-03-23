import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CcaConvertionCreateFormComponent } from './cca-convertion-create-form.component';

describe('CcaConvertionCreateFormComponent', () => {
  let component: CcaConvertionCreateFormComponent;
  let fixture: ComponentFixture<CcaConvertionCreateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CcaConvertionCreateFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CcaConvertionCreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
