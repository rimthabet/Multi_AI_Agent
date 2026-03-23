import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InternalRateOfReturnComponent } from './internal-rate-of-return.component';

describe('InternalRateOfReturnComponent', () => {
  let component: InternalRateOfReturnComponent;
  let fixture: ComponentFixture<InternalRateOfReturnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InternalRateOfReturnComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InternalRateOfReturnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
