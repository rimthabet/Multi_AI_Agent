import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryFundsComponent } from './inventory-funds.component';

describe('InventoryFundsComponent', () => {
  let component: InventoryFundsComponent;
  let fixture: ComponentFixture<InventoryFundsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryFundsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryFundsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
