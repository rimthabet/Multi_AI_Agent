import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CcaCreateFormComponent } from './cca-create-form.component';

describe('CcaCreateFormComponent', () => {
  let component: CcaCreateFormComponent;
  let fixture: ComponentFixture<CcaCreateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CcaCreateFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CcaCreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
