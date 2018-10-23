import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { HeartbeatPage } from './heartbeat.page';

import { MqttService } from '../services/mqtt.service';
import {MQTT_CONFIG} from '../tokens/mqtt-config.injection-token';

//import {NgxMqttClientModule} from 'ngx-mqtt-client';

const routes: Routes = [
  {
    path: '',
    component: HeartbeatPage
  }
];
const config = {
		host: 'm15.cloudmqtt.com',
		protocol: 'wss',
		port: 32863,
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

    RouterModule.forChild(routes)
  ],
  providers: [MqttService, {provide: MQTT_CONFIG, useValue: config}],
  declarations: [HeartbeatPage]
})
export class HeartbeatPageModule {}


/*
	NgxMqttClientModule.withOptions({
		host: 'm15.cloudmqtt.com',
		protocol: 'mqtt',
		port: 12863,
		path: '/esp',
        keepalive: 5,
		username: 'xrufgoyx',
		password: 'oWzHcp2N5M4f'
	}),
*/