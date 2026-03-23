import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefundsConversionsOcasComponent } from './refunds-conversions-ocas.component';

describe('RefundsConversionsOcasComponent', () => {
  let component: RefundsConversionsOcasComponent;
  let fixture: ComponentFixture<RefundsConversionsOcasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RefundsConversionsOcasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RefundsConversionsOcasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
