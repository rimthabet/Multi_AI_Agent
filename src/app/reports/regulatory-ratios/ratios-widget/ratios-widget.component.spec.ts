import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RatiosWidgetComponent } from './ratios-widget.component';

describe('RatiosWidgetComponent', () => {
  let component: RatiosWidgetComponent;
  let fixture: ComponentFixture<RatiosWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RatiosWidgetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RatiosWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
