import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Gauge01Component } from './gauge-01.component';

describe('Gauge01Component', () => {
  let component: Gauge01Component;
  let fixture: ComponentFixture<Gauge01Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Gauge01Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Gauge01Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
