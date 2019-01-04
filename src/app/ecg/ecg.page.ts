import { Component, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import {MqttService} from '../services/mqtt.service';
import {SubscriptionGrant} from '../models/subscription-grant';
import {ConnectionStatus} from '../models/connection-status';
import {MqttMessage} from '../models/mqtt-message';
import {NotificationMessage} from '../models/notification-message';
import {IClientOptions, MqttClient} from 'mqtt';


@Component({
	selector: 'app-ecg',
	templateUrl: './ecg.page.html',
	styleUrls: ['./ecg.page.scss'],
})
export class ECGPage implements  AfterViewInit, OnDestroy  {
	@ViewChild("canvasobject") myCanvas;
	rectW:number = 50;
	rectH:number =  50;
	maxSignal:number = 700;
	minSignal:number = 500;


	screenSized: number = 0;
	canvasPos: number = 0;
	rectColor:string = "#FF0000";
	context:CanvasRenderingContext2D;

	private counter = 0;

	messages: Array<MqttMessage> = [];
	lastmessage: MqttMessage = {"from": "teste", "notification": {"title": "RAW", "data": "550", "type": "", "counter":3}};

	status: Array<string> = [];
	RAW: number = 0;
	BPM: number = 0;
	IBI: number = 0;
	ball: any = {};
	point: any = {};
	current_point: number = 0;

	total:number = 0;
	qty:number = 0;

	points:any = [];

	lastrawmsg: number = 0;

	constructor(private _mqttService: MqttService) {
		this._mqttService.status().subscribe((s: ConnectionStatus) => {
			const status = s === ConnectionStatus.CONNECTED ? 'CONNECTED' : 'DISCONNECTED';
			this.status.push(`Mqtt client connection status: ${status}`);
		});
		this.subscribe();
		//this.sendMsg();
		//this.points.push({y:0,x:10});
	}

	connect(config: IClientOptions): void {
		this._mqttService.connect(config);
	}

	subscribe(): void {
		this._mqttService.subscribeTo<MqttMessage>('esp/000001/LO')
		.subscribe({
			next: (msg: SubscriptionGrant | MqttMessage) => {
				if (msg instanceof SubscriptionGrant) {
					this.status.push('Subscribed to esp/000001/LO topic!');
				} else {
					msg.notification.type = "Signal";
					//this.points.push({y:Number(msg.notification.data),x:10});
				 let raw: number = Number(msg.notification.data);
				 if (raw != this.RAW){
					 //let midSignal = (((((this.minSignal+this.maxSignal)/2)*4)+raw)/5);

	 				 /*this.minSignal = (midSignal<24)?0:midSignal-24;
	 				 this.maxSignal = (midSignal>1000)?1024:midSignal+24;
					 this.status.unshift('midSignal: '+ midSignal);
					 if (this.status.length > 40) this.status.pop();
					 this.status.unshift('minSignal: '+ this.minSignal);
					 if (this.status.length > 40) this.status.pop();
					 this.status.unshift('maxSignal: '+ this.maxSignal);
					 if (this.status.length > 40) this.status.pop();
*/
					 if (raw>this.minSignal || raw<this.maxSignal) {
							//if (msg.notification.counter>this.lastmessage.notification.counter){
								this.RAW = raw;
								this.screenSized = this.rangePercentage(raw,this.minSignal,this.maxSignal, 0,this.rectH);
								this.status.unshift('screenSized: '+ this.screenSized);
								if (this.status.length > 20) this.status.pop();
								this.points[0] = {y:this.screenSized,x:5};
								this.lastmessage = msg;
								this.messages.push(msg);
								this.lastrawmsg = Date.now();
							//}
					  } else{
								this.status.unshift('Calibrando... '+ this.rectH/2);
								if (this.status.length > 20) this.status.pop();
								this.status.unshift('raw: '+ raw);
								if (this.status.length > 20) this.status.pop();
								this.points[0] = {y:this.rectH/2,x:10};
						}
					}
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
					msg.notification.type = "BPM";
					this.BPM = Number(msg.notification.data);
				}
			},
			error: (error: Error) => {
				this.status.push(`Something went wrong: ${error.message}`);
			}
		});
		this._mqttService.subscribeTo<MqttMessage>('esp/000001/RAW')
		.subscribe({
			next: (msg: SubscriptionGrant | MqttMessage) => {
				if (msg instanceof SubscriptionGrant) {
					this.status.push('Subscribed to esp/000001/RAW topic!');
				} else {

					msg.notification.type = "Signal";

					let raw: number = Number(msg.notification.data);

					if (this.qty<100){
						if (raw < 300 || raw > 950) return;
						this.total = this.total + raw;
						this.qty++;
					}else{
						let current_val:number = this.total/this.qty;
						this.RAW = current_val;
					}
				}

			},
			error: (error: Error) => {
				this.status.push(`Something went wrong: ${error.message}`);
			}
		});
	}


	sendMsg(): void {
		this._mqttService.publishTo<MqttMessage>('esp/000001/info', {from: '000001', notification: {title: 'teste', data: 'teste'}}).subscribe({
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
		//this.rectW = canvas.width = document.body.clientWidth - 20;
		//this.rectH = canvas.height = document.body.clientHeight/2;
		this.rectW = canvas.width = document.getElementsByClassName("canvascard")[0].clientWidth;
		this.rectH = canvas.height = document.body.clientHeight/2;

		this.ball = {
			x: 0,
			y: this.rectH / 2,
		};
		this.point = {
			x: 0,
			y: this.ball.y
		};

		this.points.push({y:this.rectH / 2,x:1});
		this.context.fillStyle = "rgba(255, 0, 0, 1)";
		this.context.clearRect(0, 0, this.rectW,this.rectH);
		this.render();
	}

	ngAfterViewChecked() {
		let actualWidth = document.getElementsByClassName("canvascard")[0].clientWidth;
		if (actualWidth != this.rectW){
			let canvas = this.myCanvas.nativeElement;
			this.rectW = canvas.width = document.getElementsByClassName("canvascard")[0].clientWidth;
			this.point.x = this.ball.x = 0;
			this.context.clearRect(0, 0, this.rectW,this.rectH);
		}

	}

	render(){
		requestAnimationFrame(()=> {
			/*let newDate = Date.now();
			if (newDate > this.lastrawmsg + 10){
				this.points = [];
				this.points[0] = {y:0,x:10};
			};*/
			this.render();
		});
		this.animateTo();
		var ctx = this.context;
		ctx.fillStyle = "rgba(255, 255, 255, .01)";
		ctx.fillRect(0,0,this.rectW,this.rectH);
		ctx.fillStyle = "rgba(255, 0, 0, 1)";
		ctx.beginPath();
		ctx.arc(this.ball.x, this.ball.y, 1, 0, 2*Math.PI);
		ctx.closePath();
		ctx.fill();
	}

	animateTo() {
		if (this.ball.x==this.point.x) {
			this.point = {y: this.points[0].y, x: this.point.x+10};
			//this.point.x = this.point.x+this.points[0].x;
			//this.point.y = this.points[0].y;
		}

		//var dis = this.dist(this.ball.x, this.point.x+this.points[this.current_point].x,this.ball.y, this.points[this.current_point].y);
		var dis = this.dist(this.ball.x, this.point.x,this.ball.y, this.point.y);
		if( dis.d > 1 ) {
			var s = Math.abs(dis.dy) > 13 ? 2 : 1;
			this.ball.x += -( dis.dx / dis.d )*s;
			this.ball.y += -( dis.dy / dis.d )*s;
		} else {
			this.ball.x = this.point.x;
			this.ball.y = this.point.y;
			//this.point.x += 1;

			if( this.point.x >= this.rectW ) {
					this.point.x = this.ball.x = 0;
					this.context.clearRect(0, 0, this.rectW,this.rectH);
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

	rangePercentage (input: number, range_min: number, range_max: number, newRange_min: number, newRange_max: number): number{

	    let percentage: number = ((newRange_max-newRange_min)*(input - range_min)/(range_max - range_min))+newRange_min;

	    if (percentage > newRange_max) {
	        percentage = newRange_max;
	    } else if (percentage < newRange_min){
	        percentage = newRange_min;
	    }

	    return percentage;
	}

}
