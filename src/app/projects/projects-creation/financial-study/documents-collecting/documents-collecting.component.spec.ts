import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentsCollectingComponent } from './documents-collecting.component';

describe('DocumentsCollectingComponent', () => {
  let component: DocumentsCollectingComponent;
  let fixture: ComponentFixture<DocumentsCollectingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentsCollectingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentsCollectingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
