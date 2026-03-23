import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComiteInvestmentDocumentGenerationComponent } from './comite-investment-document-generation.component';

describe('ComiteInvestmentDocumentGenerationComponent', () => {
  let component: ComiteInvestmentDocumentGenerationComponent;
  let fixture: ComponentFixture<ComiteInvestmentDocumentGenerationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComiteInvestmentDocumentGenerationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComiteInvestmentDocumentGenerationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
