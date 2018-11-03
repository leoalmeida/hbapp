import { Component, OnDestroy } from '@angular/core';
import {MqttService} from '../services/mqtt.service';
import {SubscriptionGrant} from '../models/subscription-grant';
import {ConnectionStatus} from '../models/connection-status';
import {IClientOptions, MqttClient} from 'mqtt';

export interface MqttMessage {
	from: string;
	data: string;
	type?: string;
}

@Component({
  selector: 'app-list',
  templateUrl: 'list.page.html',
  styleUrls: ['list.page.scss']
})
export class ListPage implements OnDestroy {

  rawMessages: Array<MqttMessage> = [];
  bpmMessages: Array<MqttMessage> = [];
  ibiMessages: Array<MqttMessage> = [];

	status: Array<string> = [];
	BPM: number = 0;
	IBI: number = 0;
  RAW: number = 0;

  private selectedItem: any;
  private icons = [
    'flask',
    'wifi',
    'beer',
    'football',
    'basketball',
    'paper-plane',
    'american-football',
    'boat',
    'bluetooth',
    'build',
    'heart'
  ];
  public items: Array<{ title: string; value: number; icon: string }> = [];
  constructor(private _mqttService: MqttService) {
		this._mqttService.status().subscribe((s: ConnectionStatus) => {
			const status = s === ConnectionStatus.CONNECTED ? 'CONNECTED' : 'DISCONNECTED';
			this.status.push(`Mqtt client connection status: ${status}`);
		});
		this.subscribe();
		//this.sendMsg();
		this.items.push({
        title: 'Raw',
        value: 0,
        icon: 'analytics'
      },{
          title: 'BPM',
          value: 0,
          icon: 'heart'
        },{
            title: 'IBI',
            value: 0,
            icon: 'stats'
          });
	}

  	connect(config: IClientOptions): void {
  		this._mqttService.connect(config);
  	}

    subscribe(): void {
  		this._mqttService.subscribeTo<MqttMessage>('esp/000001/RAW')
  		.subscribe({
  			next: (msg: SubscriptionGrant | MqttMessage) => {
  				if (msg instanceof SubscriptionGrant) {
  					this.status.push('Subscribed to esp/000001/RAW topic!');
  				} else {
  					this.rawMessages.push(msg);
  					this.RAW = Number(msg.data);
            this.items[0].value = this.RAW;
  				}
  			},
  			error: (error: Error) => {
  				this.status.push(`Something went wrong: ${error.message}`);
  			}
  		});
  		this._mqttService.subscribeTo<MqttMessage>('esp/000001/BPM')
  		.subscribe({
  			next: (msg: SubscriptionGrant | MqttMessage) => {
  				if (msg instanceof SubscriptionGrant) {
  					this.status.push('Subscribed to esp/000001/BPM topic!');
  				} else {
            this.bpmMessages.push(msg);
  					this.BPM = Number(msg.data);
            this.items[1].value = this.BPM;
  				}
  			},
  			error: (error: Error) => {
  				this.status.push(`Something went wrong: ${error.message}`);
  			}
  		});
  		this._mqttService.subscribeTo<MqttMessage>('esp/000001/IBI')
  		.subscribe({
  			next: (msg: SubscriptionGrant | MqttMessage) => {
  				if (msg instanceof SubscriptionGrant) {
  					this.status.push('Subscribed to esp/000001/IBI topic!');
  				} else {
            this.ibiMessages.push(msg);
  					this.IBI = Number(msg.data);
            this.items[2].value = this.IBI;
  				}
  			},
  			error: (error: Error) => {
  				this.status.push(`Something went wrong: ${error.message}`);
  			}
  		});
  	}

    unsubscribe(): void {
  		this._mqttService.unsubscribeFrom('esp/000001/RAW').subscribe({
  			next: () => {
  				this.status.push('Unsubscribe from esp/000001/RAW topic');
  			},
  			error: (error: Error) => {
  				this.status.push(`Something went wrong: ${error.message}`);
  			}
  		});
      this._mqttService.unsubscribeFrom('esp/000001/BPM').subscribe({
  			next: () => {
  				this.status.push('Unsubscribe from esp/000001/BPM topic');
  			},
  			error: (error: Error) => {
  				this.status.push(`Something went wrong: ${error.message}`);
  			}
  		});
      this._mqttService.unsubscribeFrom('esp/000001/IBI').subscribe({
  			next: () => {
  				this.status.push('Unsubscribe from esp/000001/IBI topic');
  			},
  			error: (error: Error) => {
  				this.status.push(`Something went wrong: ${error.message}`);
  			}
  		});
  	}

  	/**
  	* The purpose of this is, when the user leave the app we should cleanup our subscriptions
  	* and close the connection with the broker
  	*/
  	ngOnDestroy(): void {
  		this._mqttService.end();
  	}

}
