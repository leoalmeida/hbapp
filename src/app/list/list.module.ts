import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { ListPage } from './list.page';

import { MqttService } from '../services/mqtt.service';
import {MQTT_CONFIG} from '../tokens/mqtt-config.injection-token';

const config = {
		host: '192.168.0.17',
		protocol: 'ws',
		port: 3004,
		path: '',
        keepalive: 5,
		username: 'xrufgoyx',
		password: 'oWzHcp2N5M4f'
	};


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        component: ListPage
      }
    ])
  ],
  providers: [MqttService, {provide: MQTT_CONFIG, useValue: config}],
  declarations: [ListPage]
})
export class ListPageModule {}
