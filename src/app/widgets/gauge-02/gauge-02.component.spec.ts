import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Gauge02Component } from './gauge-02.component';

describe('Gauge02Component', () => {
  let component: Gauge02Component;
  let fixture: ComponentFixture<Gauge02Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Gauge02Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Gauge02Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
