import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'heartbeat',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: './home/home.module#HomePageModule'
  },
  {
    path: 'list',
    loadChildren: './list/list.module#ListPageModule'
  },
  { path: 'heartbeat', loadChildren: './heartbeat/heartbeat.module#HeartbeatPageModule' },
  { path: 'beatpermin', loadChildren: './beatpermin/beatpermin.module#BeatPerMinPageModule' },
  { path: 'ecg', loadChildren: './ecg/ecg.module#ECGPageModule' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
