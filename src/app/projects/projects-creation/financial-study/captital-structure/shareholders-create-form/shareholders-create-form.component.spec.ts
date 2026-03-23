import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareholdersCreateFormComponent } from './shareholders-create-form.component';

describe('ShareholdersCreateFormComponent', () => {
  let component: ShareholdersCreateFormComponent;
  let fixture: ComponentFixture<ShareholdersCreateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShareholdersCreateFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShareholdersCreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
