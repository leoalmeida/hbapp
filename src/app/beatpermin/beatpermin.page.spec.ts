import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BeatPerMinPage } from './heartbeat.page';

describe('BeatPerMinPage', () => {
  let component: BeatPerMinPage;
  let fixture: ComponentFixture<BeatPerMinPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BeatPerMinPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BeatPerMinPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
