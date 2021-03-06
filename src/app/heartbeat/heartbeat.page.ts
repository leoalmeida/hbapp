import { Component, OnDestroy, ViewChild, AfterViewChecked, AfterViewInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import {MqttService} from '../services/mqtt.service';
import {SubscriptionGrant} from '../models/subscription-grant';
import {ConnectionStatus} from '../models/connection-status';
import {MqttMessage} from '../models/mqtt-message';
import {NotificationMessage} from '../models/notification-message';
import {IClientOptions, MqttClient} from 'mqtt';

@Component({
	selector: 'app-heartbeat',
	templateUrl: './heartbeat.page.html',
	styleUrls: ['./heartbeat.page.scss'],
})
export class HeartbeatPage implements  AfterViewInit, AfterViewChecked, OnDestroy  {
	@ViewChild("rawcanvasobject") myRAWCanvas;
	@ViewChild("bpmcanvasobject") myBPMCanvas;
	@ViewChild("ibicanvasobject") myIBICanvas;
	rawrectW:number = 50;
	rawrectH:number =  50;
	bpmrectW:number = 50;
	bpmrectH:number =  50;
	ibirectW:number = 50;
	ibirectH:number =  50;

	midSignal:number = 600;
	maxSignal:number = 800;
	minSignal:number = 400;

	maxBPM:number = 200;
	minBPM:number = 50;

	maxIBI:number = 3000;
	minIBI:number = 200;

	screenSized: number = 0;
	canvasPos: number = 0;
	rectColor:string = "#FF0000";
	rawcontext:CanvasRenderingContext2D;
	bpmcontext:CanvasRenderingContext2D;
	ibicontext:CanvasRenderingContext2D;

	private counter = 0;

	messages: Array<MqttMessage> = [];
	lastmessage: MqttMessage = {"from": "teste", "notification": {"title": "RAW", "data": "550", "type": "", "counter":3}};

	status: Array<string> = [];
	RAW: number = 0;
	BPM: number = 0;
	IBI: number = 0;
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
								this.screenSized = this.rangePercentage(raw,this.minSignal,this.maxSignal, 0,this.rawrectH);
								this.rawpoints[0] = {y:this.rawrectH-this.screenSized,x:5};
								this.lastmessage = msg;
								this.messages.push(msg);
								this.lastrawmsg = Date.now();
							//}
							console.log(`raw msg ${raw}`);
					  }
					} else{
						this.calibrationTotal += raw;
						this.calibrationSize ++;
						if (this.calibrationSize >= 10) {
							this.midSignal = this.calibrationTotal/this.calibrationSize;
							this.minSignal = this.midSignal - 200;
							this.maxSignal = this.midSignal + 200;
							this.calibrating = false;
							this.calibrationTotal=0;
							this.calibrationSize=0;
							//this.rawcontext.clearRect(0, 0, this.rawrectW,this.rawrectH);
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
							let bpmScreenSized = this.rangePercentage(bpm,this.minBPM,this.maxBPM, 0,this.bpmrectH);
							this.bpmpoints[0] = {y:this.bpmrectH-bpmScreenSized,x:2};
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
							let ibiScreenSized = this.rangePercentage(ibi,this.minIBI,this.maxIBI, 0,this.ibirectH);
							this.ibipoints[0] = {y:this.ibirectH-ibiScreenSized,x:2};
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
		this.rawpoints[0] = {y:this.rawrectH/2,x:1};
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
		let rawcanvas = this.myRAWCanvas.nativeElement;
		this.rawcontext = rawcanvas.getContext("2d");
		this.rawrectW = rawcanvas.width = document.getElementsByClassName("rawcanvascard")[0].clientWidth;
		this.rawrectH = rawcanvas.height = (document.body.clientHeight-230)/3;
		this.rawball = {x: 0,y: this.rawrectH / 2};
		this.rawpoint = {x: 0,y: this.rawball.y};
		this.rawpoints.push({y:this.rawrectH / 2,x:10});
		this.rawcontext.fillStyle = "rgba(255, 0, 0, 1)";
		this.rawcontext.clearRect(0, 0, this.rawrectW,this.rawrectH);


		let bpmcanvas = this.myBPMCanvas.nativeElement;
		this.bpmcontext = bpmcanvas.getContext("2d");
		this.bpmrectW = bpmcanvas.width = document.getElementsByClassName("bpmcanvascard")[0].clientWidth;
		this.bpmrectH = bpmcanvas.height = (document.body.clientHeight-230)/3;
		this.bpmball = {x: 0,y: this.bpmrectH / 2};
		this.bpmpoint = {x: 0,y: this.bpmball.y};
		this.bpmpoints.push({y:this.bpmrectH / 2,x:2});
		this.bpmcontext.fillStyle = "rgba(0, 255, 0, 1)";
		this.bpmcontext.clearRect(0, 0, this.bpmrectW,this.bpmrectH);

		let ibicanvas = this.myIBICanvas.nativeElement;
		this.ibicontext = ibicanvas.getContext("2d");
		this.ibirectW = ibicanvas.width = document.getElementsByClassName("ibicanvascard")[0].clientWidth;
		this.ibirectH = ibicanvas.height = (document.body.clientHeight-230)/3;
		this.ibiball = {x: 0,y: this.ibirectH / 2};
		this.ibipoint = {x: 0,y: this.ibiball.y};
		this.ibipoints.push({y:this.ibirectH / 2,x:2});
		this.ibicontext.fillStyle = "rgba(0, 0, 255, 1)";
		this.ibicontext.clearRect(0, 0, this.ibirectW,this.ibirectH);

		this.renderRAW();
		this.renderBPM();
		this.renderIBI();
	}

	ngAfterViewChecked() {
		let actualRAWWidth = document.getElementsByClassName("rawcanvascard")[0].clientWidth;
		if (actualRAWWidth != this.rawrectW){
			let canvas = this.myRAWCanvas.nativeElement;
			this.rawrectW = canvas.width = document.getElementsByClassName("rawcanvascard")[0].clientWidth;
			this.rawpoint.x = this.rawball.x = 0;
			this.rawcontext.clearRect(0, 0, this.rawrectW,this.rawrectH);
		}
		let actuaBPMlWidth = document.getElementsByClassName("bpmcanvascard")[0].clientWidth;
		if (actuaBPMlWidth != this.bpmrectW){
			let canvas = this.myBPMCanvas.nativeElement;
			this.bpmrectW = canvas.width = document.getElementsByClassName("bpmcanvascard")[0].clientWidth;
			this.bpmpoint.x = this.bpmball.x = 0;
			this.bpmcontext.clearRect(0, 0, this.bpmrectW,this.bpmrectH);
		}
		let actualIBIWidth = document.getElementsByClassName("ibicanvascard")[0].clientWidth;
		if (actualIBIWidth != this.ibirectW){
			let canvas = this.myIBICanvas.nativeElement;
			this.ibirectW = canvas.width = document.getElementsByClassName("ibicanvascard")[0].clientWidth;
			this.ibipoint.x = this.ibiball.x = 0;
			this.ibicontext.clearRect(0, 0, this.ibirectW,this.ibirectH);
		}
	}

	renderRAW(){
		requestAnimationFrame(()=> {
			this.renderRAW();
		});
		let context = this.rawcontext;
		if (this.rawball.x==this.rawpoint.x && this.rawpoint.y != this.rawpoints[0].y) {
			this.rawpoint.y = this.rawpoints[0].y;
			this.rawpoint.x += this.rawpoints[0].x;
		}

		//var dis = this.dist(ibiball.x, ibipoint.x+ibipoints[this.current_ibipoint].x,ibiball.y, ibipoints[this.current_ibipoint].y);
		var dis = this.dist(this.rawball.x, this.rawpoint.x,this.rawball.y, this.rawpoint.y);
		if( dis.d > 1 ) {
			var s = Math.abs(dis.dy) > 13 ? 3 : 1;
			this.rawball.x += -( dis.dx / dis.d )*s;
			this.rawball.y += -( dis.dy / dis.d )*s;
		} else {
			this.rawball.x = this.rawpoint.x;
			this.rawball.y = this.rawpoint.y;
			//ibipoint.x += 1;

			if( this.rawpoint.x >= this.rawrectW ) {
					this.rawpoint.x = this.rawball.x = 0;
					context.clearRect(0, 0, this.rawrectW,this.rawrectH);
			}
		}
		context.fillStyle = "rgba(255, 255, 255, .01)";
		context.fillRect(0,0,this.rawrectW,this.rawrectH);
		context.fillStyle = "rgba(255, 0, 0, 1)";
		context.beginPath();
		context.arc(this.rawball.x, this.rawball.y, 2, 0, 2*Math.PI);
		context.closePath();
		context.fill();
	}

	renderBPM(){
		requestAnimationFrame(()=> {
			this.renderBPM();
		});
		let context = this.bpmcontext;
		if (this.bpmball.x==this.bpmpoint.x) {
			this.bpmpoint.y = this.bpmpoints[0].y;
			this.bpmpoint.x += this.bpmpoints[0].x;
		}

		//var dis = this.dist(ibiball.x, ibipoint.x+ibipoints[this.current_ibipoint].x,ibiball.y, ibipoints[this.current_ibipoint].y);
		var dis = this.dist(this.bpmball.x, this.bpmpoint.x,this.bpmball.y, this.bpmpoint.y);
		if( dis.d > 1 ) {
			var s = Math.abs(dis.dy) > 13 ? 3 : 1;
			this.bpmball.x += -( dis.dx / dis.d )*s;
			this.bpmball.y += -( dis.dy / dis.d )*s;
		} else {
			this.bpmball.x = this.bpmpoint.x;
			this.bpmball.y = this.bpmpoint.y;
			//ibipoint.x += 1;

			if( this.bpmpoint.x >= this.bpmrectW ) {
					this.bpmpoint.x = this.bpmball.x = 0;
					context.clearRect(0, 0, this.bpmrectW,this.bpmrectH);
			}
		}

		context.fillStyle = "rgba(255, 255, 255, .01)";
		context.fillRect(0,0,this.bpmrectW,this.bpmrectH);
		context.fillStyle = "rgba(0, 255, 0, 1)";
		context.beginPath();
		context.arc(this.bpmball.x, this.bpmball.y, 2, 0, 2*Math.PI);
		context.closePath();
		context.fill();
	}

	renderIBI(){
		requestAnimationFrame(()=> {
			this.renderIBI();
		});
		let context = this.ibicontext;

		if (this.ibiball.x==this.ibipoint.x) {
			this.ibipoint.y = this.ibipoints[0].y;
			this.ibipoint.x += this.ibipoints[0].x;
		}

		//var dis = this.dist(ibiball.x, ibipoint.x+ibipoints[this.current_ibipoint].x,ibiball.y, ibipoints[this.current_ibipoint].y);
		var dis = this.dist(this.ibiball.x, this.ibipoint.x,this.ibiball.y, this.ibipoint.y);
		if( dis.d > 1 ) {
			var s = Math.abs(dis.dy) > 13 ? 3 : 1;
			this.ibiball.x += -( dis.dx / dis.d )*s;
			this.ibiball.y += -( dis.dy / dis.d )*s;
		} else {
			this.ibiball.x = this.ibipoint.x;
			this.ibiball.y = this.ibipoint.y;
			//ibipoint.x += 1;

			if( this.ibipoint.x >= this.ibirectW ) {
					this.ibipoint.x = this.ibiball.x = 0;
					context.clearRect(0, 0, this.ibirectW,this.ibirectH);
			}
		}
		context.fillStyle = "rgba(255, 255, 255, .01)";
		context.fillRect(0,0,this.ibirectW,this.ibirectH);
		context.fillStyle = "rgba(0, 0, 255, 1)";
		context.beginPath();
		context.arc(this.ibiball.x, this.ibiball.y, 2, 0, 2*Math.PI);
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
