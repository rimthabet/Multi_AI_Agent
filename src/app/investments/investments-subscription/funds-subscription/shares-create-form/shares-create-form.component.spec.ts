import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharesCreateFormComponent } from './shares-create-form.component';

describe('SharesCreateFormComponent', () => {
  let component: SharesCreateFormComponent;
  let fixture: ComponentFixture<SharesCreateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharesCreateFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SharesCreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
