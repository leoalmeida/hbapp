import { Component, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements AfterViewInit{
  @ViewChild("heartbeatcanvas") myCanvas;
  rectW:number = 100;
  rectH:number =  100;
  rectColor:string = "#FF0000";
  context:CanvasRenderingContext2D;

	ball: any = {};
	point: any = {};
	current_point: number = 0;

  points:any = [
  		{y:0,x:20},
  		{y:0,x:1},
          {y:3,x:1},
  	    {y:-10,x:2},
  		{y:10,x:2},
  	    {y:-12,x:3},
  	    {y:35,x:5},
  	    {y:-25,x:4},
  	    {y:14,x:3},
  	    {y:5,x:2},
  		{y:0,x:1},
  		{y:0,x:20}
  	];



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
