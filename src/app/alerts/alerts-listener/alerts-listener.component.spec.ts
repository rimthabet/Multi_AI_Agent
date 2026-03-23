import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertsListenerComponent } from './alerts-listener.component';

describe('AlertsListenerComponent', () => {
  let component: AlertsListenerComponent;
  let fixture: ComponentFixture<AlertsListenerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertsListenerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlertsListenerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
