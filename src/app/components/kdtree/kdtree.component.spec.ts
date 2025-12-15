import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KdtreeComponent } from './kdtree.component';

describe('KdtreeComponent', () => {
  let component: KdtreeComponent;
  let fixture: ComponentFixture<KdtreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KdtreeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KdtreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
