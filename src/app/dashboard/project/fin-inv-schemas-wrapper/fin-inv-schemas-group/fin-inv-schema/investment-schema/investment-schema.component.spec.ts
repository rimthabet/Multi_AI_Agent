import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentSchemaComponent } from './investment-schema.component';

describe('InvestmentSchemaComponent', () => {
  let component: InvestmentSchemaComponent;
  let fixture: ComponentFixture<InvestmentSchemaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentSchemaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentSchemaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
