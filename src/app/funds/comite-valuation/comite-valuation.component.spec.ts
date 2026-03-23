import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComiteValuationComponent } from './comite-valuation.component';

describe('ComiteValuationComponent', () => {
  let component: ComiteValuationComponent;
  let fixture: ComponentFixture<ComiteValuationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComiteValuationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComiteValuationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
