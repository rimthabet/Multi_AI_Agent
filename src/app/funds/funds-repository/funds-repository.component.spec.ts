import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundsRepositoryComponent } from './funds-repository.component';

describe('FundsRepositoryComponent', () => {
  let component: FundsRepositoryComponent;
  let fixture: ComponentFixture<FundsRepositoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundsRepositoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundsRepositoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
