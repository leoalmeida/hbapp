import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECGPage } from './heartbeat.page';

describe('ECGPage', () => {
  let component: ECGPage;
  let fixture: ComponentFixture<ECGPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECGPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECGPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
