import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsCreationComponent } from './funds-creation.component';

describe('FundsCreationComponent', () => {
  let component: FundsCreationComponent;
  let fixture: ComponentFixture<FundsCreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsCreationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
