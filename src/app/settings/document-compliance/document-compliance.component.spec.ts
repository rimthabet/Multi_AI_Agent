import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentComplianceComponent } from './document-compliance.component';

describe('DocumentComplianceComponent', () => {
  let component: DocumentComplianceComponent;
  let fixture: ComponentFixture<DocumentComplianceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentComplianceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentComplianceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
