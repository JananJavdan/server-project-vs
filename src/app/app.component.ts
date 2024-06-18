import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ServerService } from './service/server.service';
import { catchError, map, Observable, of, startWith } from 'rxjs';
import { AppState } from './interface/app-state';
import { CustomResponse } from './interface/custom-response';
import { response } from 'express';
import { DataState } from './enum/data-state.enum';
import { error } from 'console';
import { AsyncPipe, JsonPipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http'; 

 
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AsyncPipe, JsonPipe, HttpClientModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  appState$: Observable<AppState<CustomResponse>>;

 constructor(private serverService: ServerService) {}
 
 ngOnInit(): void {
  this.appState$ = this.serverService.servers$
  .pipe(
    map(response => ({
      dataState: DataState.LOADED_STATE,
      appData: response,
      error: null
    }) as AppState<CustomResponse>),
    startWith({ 
      dataState: DataState.LOADING_STATE, 
      appData: null,
      error: null
    } as AppState<CustomResponse>),
    catchError((error: string) => 
      of({
        dataState: DataState.ERROR_STATE,
        appData: null,
        error: error 
      } as AppState<CustomResponse>)
    )
  );
  }
 
}