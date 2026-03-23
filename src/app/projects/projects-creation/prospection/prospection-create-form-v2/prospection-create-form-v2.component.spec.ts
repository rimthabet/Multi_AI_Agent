import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProspectionCreateFormV2Component } from './prospection-create-form-v2.component';

describe('ProspectionCreateFormV2Component', () => {
  let component: ProspectionCreateFormV2Component;
  let fixture: ComponentFixture<ProspectionCreateFormV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProspectionCreateFormV2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProspectionCreateFormV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
