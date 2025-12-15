import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BinSrchTreeComponent } from './bin-srch-tree.component';

describe('BinSrchTreeComponent', () => {
  let component: BinSrchTreeComponent;
  let fixture: ComponentFixture<BinSrchTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BinSrchTreeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BinSrchTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
