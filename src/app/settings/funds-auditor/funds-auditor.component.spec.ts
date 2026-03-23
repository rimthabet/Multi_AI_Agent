import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsAuditorComponent } from './funds-auditor.component';

describe('FundsAuditorComponent', () => {
  let component: FundsAuditorComponent;
  let fixture: ComponentFixture<FundsAuditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsAuditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsAuditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
