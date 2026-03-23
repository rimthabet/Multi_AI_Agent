import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentsDocumentsCollectingComponent } from './investments-documents-collecting.component';

describe('CollectionOfDocumentsComponent', () => {
  let component: InvestmentsDocumentsCollectingComponent;
  let fixture: ComponentFixture<InvestmentsDocumentsCollectingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentsDocumentsCollectingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentsDocumentsCollectingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
