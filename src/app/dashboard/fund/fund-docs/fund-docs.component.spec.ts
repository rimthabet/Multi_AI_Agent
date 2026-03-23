import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundDocsComponent } from './fund-docs.component';

describe('FundDocsComponent', () => {
  let component: FundDocsComponent;
  let fixture: ComponentFixture<FundDocsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundDocsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundDocsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
