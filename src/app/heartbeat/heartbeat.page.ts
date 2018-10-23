import { Component, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import {MqttService} from '../services/mqtt.service';
import {SubscriptionGrant} from '../models/subscription-grant';
import {ConnectionStatus} from '../models/connection-status';
import {IClientOptions, MqttClient} from 'mqtt';

export interface MqttMessage {
	from: string;
    body: MessageBody;
}

export interface MessageBody {
	title: string;
    //type: string;
    data: string;
}

@Component({
  selector: 'app-heartbeat',
  templateUrl: './heartbeat.page.html',
  styleUrls: ['./heartbeat.page.scss'],
})
export class HeartbeatPage implements  AfterViewInit, OnDestroy  {
	@ViewChild("heartbeatcanvas") myCanvas;
	rectW:number = 100;
	rectH:number =  100;
	rectColor:string = "#FF0000";
	context:CanvasRenderingContext2D;
	
	private counter = 0;

	messages: Array<MqttMessage> = [];

    status: Array<string> = [];
	
	ball: any = {};
	point: any = {};
	current_point: number = 0;
	
	points:any = [];

    constructor(private _mqttService: MqttService) {
		this._mqttService.status().subscribe((s: ConnectionStatus) => {
            const status = s === ConnectionStatus.CONNECTED ? 'CONNECTED' : 'DISCONNECTED';
            this.status.push(`Mqtt client connection status: ${status}`);
        });
		this.subscribe();
		this.sendMsg();
		this.points.push({y:0,x:10})
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

                        this.messages.push(msg);
						this.points.push({y:Number(msg.body.data),x:10})
                    }
                },
                error: (error: Error) => {
                    this.status.push(`Something went wrong: ${error.message}`);
                }
            });
    }


    sendMsg(): void {
        this._mqttService.publishTo<MessageBody>('esp/000001/info', {title: '', data: 'teste'}).subscribe({
            next: () => {
                this.status.push('Message sent to esp/000001/info topic');
            },
            error: (error: Error) => {
                this.status.push(`Something went wrong: ${error.message}`);
            }
        });
    }

    /**
     * Unsubscribe from fooBar topic.
     */
    unsubscribe(): void {
        this._mqttService.unsubscribeFrom('esp/000001/RAW').subscribe({
            next: () => {
                this.status.push('Unsubscribe from esp/000001/RAW topic');
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

	ngAfterViewInit() {
		let canvas = this.myCanvas.nativeElement;
		this.context = canvas.getContext("2d");

		this.rectW = canvas.width = document.body.offsetWidth;
		this.rectH = canvas.height = document.body.offsetHeight;

		this.ball = {
			x: 0,
			y: this.rectH / 2,
		};
		this.point = {
			x: 0,
			y: this.ball.y
		};

		this.context.fillStyle = "rgba(255, 0, 0, 1)";
		this.render();
	  }

	  render(){
		requestAnimationFrame(()=> {
		  this.render()
		});
		this.animateTo();
		var ctx = this.context;
		ctx.fillStyle = "rgba(0, 0, 0, .01)";
		ctx.fillRect(0,0,this.rectW,this.rectH);
		ctx.fillStyle = "rgba(255, 0, 0, 1)";
		ctx.beginPath();
		ctx.arc(this.ball.x, this.ball.y, 1, 0, 2*Math.PI, true);
		ctx.closePath();
		ctx.fill();
	  }

	  animateTo() {
		var dis = this.dist(this.ball.x, this.point.x+this.points[this.current_point].x,this.ball.y, this.point.y+this.points[this.current_point].y);
		if( dis.d > 1 ) {
		  var s = Math.abs(dis.dy) > 13 ? 2 : 1;
		  this.ball.x += -( dis.dx / dis.d )*s;
		  this.ball.y += -( dis.dy / dis.d )*s;
		} else {
		  this.ball.x = this.point.x+this.points[this.current_point].x;
		  this.ball.y = this.point.y+this.points[this.current_point].y;
		  this.point.x += this.points[this.current_point].x;
		  this.current_point++;
		  if( this.current_point >= this.points.length || this.ball.x > this.rectW ) {
			this.current_point = 0;
			if( this.ball.x > this.rectW ) {
			  this.point.x = this.ball.x = 0;
			}
		  }
		}
	  }

	  dist(x1,x2,y1,y2) {
		var dx = x1 - x2,
		  dy = y1 - y2;
		return {
		  d: Math.sqrt(dx*dx + dy*dy),
		  dx: dx,
		  dy: dy
		};
	  }

}
