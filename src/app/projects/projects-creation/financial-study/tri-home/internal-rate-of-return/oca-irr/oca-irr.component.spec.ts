import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OcaIrrComponent } from './oca-irr.component';

describe('OcaIrrComponent', () => {
  let component: OcaIrrComponent;
  let fixture: ComponentFixture<OcaIrrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OcaIrrComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(OcaIrrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
