import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComiteInterneDocumentGenerationComponent } from './comite-interne-document-generation.component';

describe('ComiteInterneDocumentGenerationComponent', () => {
  let component: ComiteInterneDocumentGenerationComponent;
  let fixture: ComponentFixture<ComiteInterneDocumentGenerationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComiteInterneDocumentGenerationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComiteInterneDocumentGenerationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
