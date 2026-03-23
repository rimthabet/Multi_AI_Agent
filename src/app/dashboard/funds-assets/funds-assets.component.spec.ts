import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsAssetsComponent } from './funds-assets.component';

describe('FundsAssetsComponent', () => {
  let component: FundsAssetsComponent;
  let fixture: ComponentFixture<FundsAssetsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsAssetsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsAssetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
