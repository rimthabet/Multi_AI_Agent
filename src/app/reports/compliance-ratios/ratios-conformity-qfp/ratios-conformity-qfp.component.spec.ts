import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RatiosConformityQfpComponent } from './ratios-conformity-qfp.component';

describe('RatiosConformityQfpComponent', () => {
  let component: RatiosConformityQfpComponent;
  let fixture: ComponentFixture<RatiosConformityQfpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatiosConformityQfpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RatiosConformityQfpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
