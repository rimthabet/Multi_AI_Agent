import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QfpRatioWidgetComponent } from './qfp-ratio-widget.component';

describe('QfpRatioWidgetComponent', () => {
  let component: QfpRatioWidgetComponent;
  let fixture: ComponentFixture<QfpRatioWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QfpRatioWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QfpRatioWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
