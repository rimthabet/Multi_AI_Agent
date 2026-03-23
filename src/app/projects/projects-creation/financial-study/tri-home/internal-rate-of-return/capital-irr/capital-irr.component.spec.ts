import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CapitalIrrComponent } from './capital-irr.component';

describe('CapitalIrrComponent', () => {
  let component: CapitalIrrComponent;
  let fixture: ComponentFixture<CapitalIrrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CapitalIrrComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CapitalIrrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
