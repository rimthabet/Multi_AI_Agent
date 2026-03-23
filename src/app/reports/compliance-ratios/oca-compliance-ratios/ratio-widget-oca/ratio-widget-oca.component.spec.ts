import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RatioWidgetOcaComponent } from './ratio-widget-oca.component';

describe('RatioWidgetOcaComponent', () => {
  let component: RatioWidgetOcaComponent;
  let fixture: ComponentFixture<RatioWidgetOcaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatioWidgetOcaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RatioWidgetOcaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
