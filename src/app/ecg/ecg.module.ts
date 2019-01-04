import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';

import { IonicModule } from '@ionic/angular';

import { ECGPage } from './ecg.page';

import { MqttService } from '../services/mqtt.service';
import {MQTT_CONFIG} from '../tokens/mqtt-config.injection-token';

//import {NgxMqttClientModule} from 'ngx-mqtt-client';

const routes: Routes = [
  {
    path: '',
    component: ECGPage
  }
];
const config = {
		host: '192.168.0.20',
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

    RouterModule.forChild(routes)
  ],
  providers: [MqttService, {provide: MQTT_CONFIG, useValue: config}],
  declarations: [ECGPage]
})
export class ECGPageModule {}


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
