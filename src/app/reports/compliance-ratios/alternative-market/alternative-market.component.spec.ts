import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlternativeMarketComponent } from './alternative-market.component';

describe('AlternativeMarketComponent', () => {
  let component: AlternativeMarketComponent;
  let fixture: ComponentFixture<AlternativeMarketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlternativeMarketComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlternativeMarketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
