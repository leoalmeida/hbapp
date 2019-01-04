import { Component, OnDestroy, ViewChild, AfterViewInit, AfterViewChecked } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import {MqttService} from '../services/mqtt.service';
import {SubscriptionGrant} from '../models/subscription-grant';
import {ConnectionStatus} from '../models/connection-status';
import {MqttMessage} from '../models/mqtt-message';
import {NotificationMessage} from '../models/notification-message';
import {IClientOptions, MqttClient} from 'mqtt';

@Component({
	selector: 'app-beatpermin',
	templateUrl: './beatpermin.page.html',
	styleUrls: ['./beatpermin.page.scss'],
})
export class BeatPerMinPage implements  AfterViewInit, AfterViewChecked, OnDestroy  {
	@ViewChild("canvasobject") myCanvas;
	rectW:number = 50;
	rectH:number =  50;
	midSignal:number = 600;
	maxSignal:number = 800;
	minSignal:number = 400;

	maxBPM:number = 200;
	minBPM:number = 50;

	maxIBI:number = 200;
	minIBI:number = 50;

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
	AMP: number = 0;
	rawball: any = {};
	bpmball: any = {};
	ibiball: any = {};
	rawpoint: any = {};
	bpmpoint: any = {};
	ibipoint: any = {};

	current_point: number = 0;

	private calibrationTotal:number = 0;
	private calibrationSize:number = 0;
	private calibrating: boolean = true;
	private loading: any = null;

	rawpoints:any = [];
	bpmpoints:any = [];
	ibipoints:any = [];

	lastrawmsg: number = 0;
	lastbpmmsg: number = 0;
	lastibimsg: number = 0;

	constructor(private _mqttService: MqttService, private loadingController: LoadingController) {
		this._mqttService.status().subscribe((s: ConnectionStatus) => {
			const status = s === ConnectionStatus.CONNECTED ? 'CONNECTED' : 'DISCONNECTED';
			this.status.unshift(`Mqtt client connection status: ${status}`);
		});
		this.subscribe();
		this.presentLoading();
		//this.sendMsg();
	}

	connect(config: IClientOptions): void {
		this._mqttService.connect(config);
	}
	subscribe(): void {
		this._mqttService.subscribeTo<MqttMessage>('esp/000001/AMP')
		.subscribe({
			next: (msg: SubscriptionGrant | MqttMessage) => {
				if (msg instanceof SubscriptionGrant) {
					this.status.unshift('Subscribed to esp/000001/AMP topic!');
					if (this.status.length > 20) this.status.pop();
				} else {
					msg.notification.type = "Amplitude";
					let amp: number = Number(msg.notification.data);

					if (!this.calibrating){
					 if (amp != this.AMP){
						 	this.AMP = amp;
							this.lastmessage = msg;
							this.messages.push(msg);
							this.lastibimsg = Date.now();
							console.log(`amp msg ${amp}`);
						}
					}
				}
			},
			error: (error: Error) => {
				this.status.unshift(`Something went wrong: ${error.message}`);
			}
		});
		this._mqttService.subscribeTo<MqttMessage>('esp/000001/RAW')
		.subscribe({
			next: (msg: SubscriptionGrant | MqttMessage) => {
				if (msg instanceof SubscriptionGrant) {
					this.status.unshift('Subscribed to esp/000001/RAW topic!');
					if (this.status.length > 20) this.status.pop();
				} else {
					msg.notification.type = "Signal";
					//this.rawpoints.push({y:Number(msg.notification.data),x:10});
				 	let raw: number = Number(msg.notification.data);
				 	if (!this.calibrating){

					 if (raw<this.minSignal || raw>this.maxSignal) {
						 	 this.calibrationTotal += raw;
						   this.calibrationSize ++;
							 if (this.calibrationSize >= 200) {
								 	//this.calibrateSensor();
							 }
					 }else if (raw != this.RAW){
							//if (msg.notification.counter>this.lastmessage.notification.counter){
								this.RAW = raw;
								this.screenSized = this.rangePercentage(raw,this.minSignal,this.maxSignal, 0,this.rectH);
								this.status.unshift('screenSized: '+ this.screenSized);
								if (this.status.length > 20) this.status.pop();
								this.rawpoints[0] = {y:this.screenSized,x:10};
								this.lastmessage = msg;
								this.messages.push(msg);
								this.lastrawmsg = Date.now();
							//}
							console.log(`raw msg ${raw}`);
					  }
					} else{
						this.calibrationTotal += raw;
						this.calibrationSize ++;
						if (this.calibrationSize >= 5) {
							this.midSignal = this.calibrationTotal/this.calibrationSize;
							this.minSignal = this.midSignal - 200;
							this.maxSignal = this.midSignal + 200;
							this.calibrating = false;
							this.calibrationTotal=0;
							this.calibrationSize=0;
							//this.context.clearRect(0, 0, this.rectW,this.rectH);
							this.loading.dismiss();
						}
					}
				}
			},
			error: (error: Error) => {
				this.status.unshift(`Something went wrong: ${error.message}`);
			}
		});
		this._mqttService.subscribeTo<MqttMessage>('esp/000001/BPM')
		.subscribe({
			next: (msg: SubscriptionGrant | MqttMessage) => {
				if (msg instanceof SubscriptionGrant) {
					this.status.unshift('Subscribed to esp/000001/BPM topic!');
				} else {
					msg.notification.type = "BPM";
					//this.rawpoints.push({y:Number(msg.notification.data),x:10});
					let bpm: number = Number(msg.notification.data);

					if (!this.calibrating){
					 if (bpm>this.minBPM && bpm<this.maxBPM && bpm != this.BPM){
						 	this.BPM = bpm;
							let bpmScreenSized = this.rangePercentage(bpm,this.minBPM,this.maxBPM, 0,this.rectH);
							this.bpmpoints[0] = {y:bpmScreenSized,x:10};
							this.lastmessage = msg;
							this.messages.push(msg);
							this.lastbpmmsg = Date.now();
							console.log(`bpm msg ${bpm}`);
						}
					}
				}
			},
			error: (error: Error) => {
				this.status.unshift(`Something went wrong: ${error.message}`);
			}
		});
		this._mqttService.subscribeTo<MqttMessage>('esp/000001/IBI')
		.subscribe({
			next: (msg: SubscriptionGrant | MqttMessage) => {
				if (msg instanceof SubscriptionGrant) {
					this.status.unshift('Subscribed to esp/000001/IBI topic!');
				} else {
					msg.notification.type = "IBI";
					let ibi: number = Number(msg.notification.data);

					if (!this.calibrating){
					 if (ibi>this.minIBI && ibi<this.maxIBI && ibi != this.IBI){
						 	this.IBI = ibi;
							let ibiScreenSized = this.rangePercentage(ibi,this.minIBI,this.maxIBI, 0,this.rectH);
							this.ibipoints[0] = {y:ibiScreenSized,x:10};
							this.lastmessage = msg;
							this.messages.push(msg);
							this.lastibimsg = Date.now();
							console.log(`ibi msg ${ibi}`);
						}
					}
				}
			},
			error: (error: Error) => {
				this.status.unshift(`Something went wrong: ${error.message}`);
			}
		});
	}

	private calibrateSensor(){
		this.status.unshift('Calibrando... ');
		if (this.status.length > 20) this.status.pop();
		this.rawpoints[0] = {y:this.rectH/2,x:1};
		this.calibrating = true;
		this.calibrationSize=0;
		this.calibrationTotal=0;
		this.presentLoading();
	}

	sendMsg(): void {
		this._mqttService.publishTo<MqttMessage>('esp/000001/info', {from: '000001', notification: {title: 'teste', data: 'teste'}}).subscribe({
			next: () => {
				this.status.unshift('Message sent to esp/000001/info topic');
			},
			error: (error: Error) => {
				this.status.unshift(`Something went wrong: ${error.message}`);
			}
		});
	}

	/**
	* Unsubscribe from fooBar topic.
	*/
	unsubscribe(): void {
		this._mqttService.unsubscribeFrom('esp/000001/RAW').subscribe({
			next: () => {
				this.status.unshift('Unsubscribe from esp/000001/RAW topic');
			},
			error: (error: Error) => {
				this.status.unshift(`Something went wrong: ${error.message}`);
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
		this.rectW = canvas.width = document.getElementsByClassName("canvascard")[0].clientWidth;
		this.rectH = canvas.height = (document.body.clientHeight)/2;
		this.rawball = {x: 0,y: this.rectH / 2};
		this.rawpoint = {x: 10,y: this.rawball.y};
		this.rawpoints.push({y:this.rectH / 2,x:10});
		this.context.fillStyle = "rgba(255, 0, 0, 1)";
		this.bpmball = {x: 0,y: this.rectH / 2};
		this.bpmpoint = {x: 10,y: this.bpmball.y};
		this.bpmpoints.push({y:this.rectH / 2,x:10});
		this.context.fillStyle = "rgba(0, 255, 0, 1)";
		this.ibiball = {x: 0,y: this.rectH / 2};
		this.ibipoint = {x: 10,y: this.ibiball.y};
		this.ibipoints.push({y:this.rectH / 2,x:10});
		this.context.fillStyle = "rgba(0, 0, 255, 1)";
		this.context.clearRect(0, 0, this.rectW,this.rectH);

		this.render();
	}

	ngAfterViewChecked() {
		let actualWidth = document.getElementsByClassName("canvascard")[0].clientWidth;
		if (actualWidth != this.rectW){
			let canvas = this.myCanvas.nativeElement;
			this.rectW = canvas.width = document.getElementsByClassName("canvascard")[0].clientWidth;
			this.rawpoint.x = this.rawball.x = 0;
			this.bpmpoint.x = this.bpmball.x = 0;
			this.ibipoint.x = this.ibiball.x = 0;
			this.context.clearRect(0, 0, this.rectW,this.rectH);
		}
	}

	render(){
		requestAnimationFrame(()=> {
			this.render();
		});

		let context = this.context;
		if (this.rawball.x==this.rawpoint.x) {
			this.rawpoint.y = this.rawpoints[0].y;
			this.rawpoint.x = this.rawpoint.x+ this.rawpoints[0].x;
		}
		var rawdis = this.dist(this.rawball.x, this.rawpoint.x,this.rawball.y, this.rawpoint.y);
		if( rawdis.d > 1 ) {
			var s = Math.abs(rawdis.dy) > 13 ? 4 : 2;
			this.rawball.x += -( rawdis.dx / rawdis.d )*s;
			this.rawball.y += -( rawdis.dy / rawdis.d )*s;
		} else {
			this.rawball.x = this.rawpoint.x;
			this.rawball.y = this.rawpoint.y;
			if( this.rawpoint.x >= this.rectW ) {
					this.rawpoint.x = this.rawball.x = 0;
					this.bpmpoint.x = this.bpmball.x = 0;
					this.ibipoint.x = this.ibiball.x = 0;
					context.clearRect(0, 0, this.rectW,this.rectH);
			}
		}
		context.fillStyle = "rgba(255, 255, 255, .01)";
		context.fillRect(0,0,this.rectW,this.rectH);
		context.fillStyle = "rgba(255, 0, 0, 1)";
		context.beginPath();
		context.arc(this.rawball.x, this.rawball.y, 3, 0, 2*Math.PI);
		context.closePath();
		context.fill();


		if (this.bpmball.x==this.bpmpoint.x) {
			this.bpmpoint.y = this.bpmpoints[0].y;
			this.bpmpoint.x = this.bpmpoint.x + this.bpmpoints[0].x;
		}
		var bpmdis = this.dist(this.bpmball.x, this.bpmpoint.x,this.bpmball.y, this.bpmpoint.y);
		if( bpmdis.d > 1 ) {
			var s = Math.abs(bpmdis.dy) > 13 ? 4 : 2;
			this.bpmball.x += -( bpmdis.dx / bpmdis.d )*s;
			this.bpmball.y += -( bpmdis.dy / bpmdis.d )*s;
		} else {
			this.bpmball.x = this.bpmpoint.x;
			this.bpmball.y = this.bpmpoint.y;
		}
		context.fillStyle = "rgba(0, 255, 0, 1)";
		context.beginPath();
		context.arc(this.bpmball.x, this.bpmball.y, 3, 0, 2*Math.PI);
		context.closePath();
		context.fill();

		if (this.ibiball.x==this.ibipoint.x) {
			this.ibipoint.y = this.ibipoints[0].y;
			this.ibipoint.x = this.ibipoint.x + this.ibipoints[0].x;
		}
		var ibidis = this.dist(this.ibiball.x, this.ibipoint.x,this.ibiball.y, this.ibipoint.y);
		if( ibidis.d > 1 ) {
			var s = Math.abs(ibidis.dy) > 13 ? 4 : 2;
			this.ibiball.x += -( ibidis.dx / ibidis.d )*s;
			this.ibiball.y += -( ibidis.dy / ibidis.d )*s;
		} else {
			this.ibiball.x = this.ibipoint.x;
			this.ibiball.y = this.ibipoint.y;
		}
		context.fillStyle = "rgba(0, 0, 255, 1)";
		context.beginPath();
		context.arc(this.ibiball.x, this.ibiball.y, 3, 0, 2*Math.PI);
		context.closePath();
		context.fill();
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


		private async presentLoading(): Promise<any> {
	    this.loading = await this.loadingController.create({
				spinner: 'dots',
				id: 'calibrating',
				showBackdrop: true,
				message: 'Calibrando sensor...',
			  translucent: true
	    });
	    return await this.loading.present();
	  }

}
