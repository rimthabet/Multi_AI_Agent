import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharesBankAccountFormComponent } from './shares-bank-account-form.component';

describe('SharesBankAccountFormComponent', () => {
  let component: SharesBankAccountFormComponent;
  let fixture: ComponentFixture<SharesBankAccountFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharesBankAccountFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SharesBankAccountFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
