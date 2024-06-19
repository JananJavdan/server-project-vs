import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AsyncPipe, JsonPipe } from '@angular/common';  // Import AsyncPipe and JsonPipe
import { HttpClientModule } from '@angular/common/http';  // Import HttpClientModule
import { FormsModule } from '@angular/forms';  // Import FormsModule
import { ServerService } from './service/server.service';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { AppState } from './interface/app-state';
import { CustomResponse } from './interface/custom-response';
import { DataState } from './enum/data-state.enum';
import { Status } from './enum/status.enum';
import { NgForm } from '@angular/forms';
import { Server } from './interface/server';
import { NotifierModule } from 'angular-notifier';
 
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    AsyncPipe,
    JsonPipe,
    HttpClientModule,
    CommonModule,
    NotifierModule,
    FormsModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  [x: string]: any;
  appState$: Observable<AppState<CustomResponse>>;
  readonly DataState = DataState;
  readonly Status = Status;
  private filterSubject = new BehaviorSubject<string>('');
  private dataSubject = new BehaviorSubject<CustomResponse>(null);
  filterStatus$ = this.filterSubject.asObservable();
  private isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoading.asObservable();
 
  constructor(private serverService: ServerService) {}
 
  ngOnInit(): void {
    this.appState$ = this.serverService.servers$
      .pipe(
        map(response => ({
          dataSubject: response,
          dataState: DataState.LOADED_STATE,
          appData: response,
          servers: response.data?.servers?.reverse() || [],
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
 
  pingServer(ipAddress: string): void {
    this.filterSubject.next(ipAddress);
    this.appState$ = this.serverService.ping$(ipAddress).pipe(
      map(response => {
        const serverIndex = this.dataSubject.value.appData.data.servers.findIndex(
          server => server.id === response.data.server.id
        );
        const updatedServers = [...this.dataSubject.value.appData.data.servers];
        updatedServers[serverIndex] = response.data.server;
 
        this.filterSubject.next('');
 
        return {
          dataState: DataState.LOADED_STATE,
          appData: {
            ...this.dataSubject.value.appData,
            data: {
              ...this.dataSubject.value.appData.data,
              servers: updatedServers
            }
          },
          error: null
        } as AppState<CustomResponse>;
      }),
      startWith({
        dataState: DataState.LOADING_STATE,
        appData: this.dataSubject.value.appData,
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
 
  deleteServer(server: Server): void {
    this.appState$ = this.serverService.delete$(server.id)
      .pipe(
        map(response => {
          const updatedServers = this.dataSubject.value.appData.data.servers.filter(s => s.id !== server.id);
 
          return {
            dataState: DataState.LOADED_STATE,
            appData: {
              ...this.dataSubject.value.appData,
              data: {
                ...this.dataSubject.value.appData.data,
                servers: updatedServers
              }
            },
            error: null
          } as AppState<CustomResponse>;
        }),
        startWith({
          dataState: DataState.LOADING_STATE,
          appData: this.dataSubject.value.appData,
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
 
  saveServer(serverForm: NgForm): void {
    this.isLoading.next(true);
    this.appState$ = this.serverService.save$(serverForm.value as Server)
      .pipe(
        map(response => {
          const updatedServers = [response.data.server, ...this.dataSubject.value.appData.data.servers];
          this.dataSubject.next({
            ...this.dataSubject.value,
            appData: {
              ...this.dataSubject.value.appData,
              data: {
                ...this.dataSubject.value.appData.data,
                servers: updatedServers
              }
            }
          });
          document.getElementById('closeModal').click();
          this.isLoading.next(false);
          serverForm.resetForm({ status: this.Status.SERVER_DOWN });
 
          return {
            dataState: DataState.LOADED_STATE,
            appData: this.dataSubject.value.appData,
            error: null
          } as AppState<CustomResponse>;
        }),
        startWith({
          dataState: DataState.LOADING_STATE,
          appData: this.dataSubject.value.appData,
          error: null
        } as AppState<CustomResponse>),
        catchError((error: string) => {
          this.isLoading.next(false);
          return of({
            dataState: DataState.ERROR_STATE,
            appData: null,
            error: error
          } as AppState<CustomResponse>);
        })
      );
  }
 
  filterServers(status: Status): void {
    this.appState$ = this.serverService.filter$(status, this.dataSubject.value)
      .pipe(
        map(response => {
          return {
            dataState: DataState.LOADED_STATE,
            appData: {
              ...this.dataSubject.value.appData,
              data: {
                ...this.dataSubject.value.appData.data,
              }
            },
            error: null
          } as AppState<CustomResponse>;
        }),
        startWith({
          dataState: DataState.LOADING_STATE,
          appData: this.dataSubject.value.appData,
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
 
  printReport(): void {
    let dataType = 'application/vnd.ms-excel.sheet.macroEnabled.12';
    let tableSelect = document.getElementById('servers');
    let tableHtml = tableSelect.outerHTML.replace(/ /g, '%20');
    let downloadLink = document.createElement('a');
    document.body.appendChild(downloadLink);
    downloadLink.href = 'data:' + dataType + ', ' + tableHtml;
    downloadLink.download = 'server-report.xls';
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }
}
 