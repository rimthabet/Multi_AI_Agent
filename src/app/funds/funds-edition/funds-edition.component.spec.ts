import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsEditionComponent } from './funds-edition.component';

describe('FundsEditionComponent', () => {
  let component: FundsEditionComponent;
  let fixture: ComponentFixture<FundsEditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsEditionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsEditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
