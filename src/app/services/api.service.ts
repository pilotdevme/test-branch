import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { IGetToken, IProject, IStartTimeBody, ITask, ITimeEntry, IUserContactInfo, IWorkType } from "../common/common.interface";
import { IAccessTokenBody } from "../common/common.interface";
import { ChromeStorageService } from "./chromeService.service";
@Injectable({
    providedIn: 'root'
})
export class ApiService {
    public header: HttpHeaders = new HttpHeaders({});
    public token: string = "";


    /* get token and set http header */
    constructor(
        private http: HttpClient,
        private chrome_service: ChromeStorageService
    ) {
        this.chrome_service.getStorageData().then(data => {
            this.token = data.token
            this.header = new HttpHeaders({
                "Authorization": `Bearer ${data.token}`
            });
        })
    }

    /* get projects lists and time entries */
    public getTimeEntries() {
        return this.http.get<ITimeEntry[]>(`${environment.awork.url}/timeentries?pageSize=4`, { headers: this.header })
    }

    /* create time entry */
    public createTimeEntry() {
        return this.http.post(`${environment.awork.url}/timeentries`, {}, { headers: this.header })
    }

    /* start timer */
    public startTimeEntry(body: IStartTimeBody) {
        return this.http.post<ITimeEntry>(`${environment.awork.url}/me/timetracking/start`, body, { headers: this.header })
    }

    /* end timer */
    public endTimeEntry() {
        return this.http.post(`${environment.awork.url}/me/timetracking/stop`, {}, { headers: this.header })
    }

    /* delete time entry */
    public deleteTimeEntry() {
        return this.http.post(`${environment.awork.url}/me/timetracking/delete`, {}, { headers: this.header })
    }

    /* time tracking settings */
    public timeTrackingSettings() {
        return this.http.get(`${environment.awork.url}/timetracking/settings`, { headers: this.header })
    }

    /* selected work type */
    public setWorkType() {
        return this.http.post(`${environment.awork.url}/timeentries/settypeofwork`, { headers: this.header })
    }

    /* get projects lists */
    public getProjects() {
        return this.http.get<IProject[]>(`${environment.awork.url}/projects`, { headers: this.header })
    }

    /* get taks lists */
    public getTasks(project_id: string) {
        return this.http.get<ITask[]>(`${environment.awork.url}/projects/${project_id}/projecttasks`, { headers: this.header })
    }

    /* get work types */
    public getTypeOfWork() {
        return this.http.get<IWorkType[]>(`${environment.awork.url}/typeofwork`, { headers: this.header })
    }

    /* get access token */
    public getToken(payload: IAccessTokenBody) {

        const client_id = `${environment.awork.clientId}`;
        const client_secret = `${environment.awork.clientSecret}`;
        // Create a Basic Authentication token by base64 encoding client_id:client_secret
        const base64Credentials = btoa(client_id + ':' + client_secret);

        // Set the HTTP headers
        const headers = new HttpHeaders({
            'Authorization': 'Basic ' + base64Credentials,
            'Content-Type': 'application/x-www-form-urlencoded'
        });

        const body = new HttpParams()
            .set('grant_type', payload.grant_type)
            .set('code', payload.code)
            .set('client_id', payload.client_id)
            .set('redirect_uri', payload.redirect_uri);

        return this.http.post<IGetToken>(`${environment.awork.url}/accounts/token`, body, { headers: headers })
    }

    /* get loggedIn user */
    public getLoggedInUser() {
        return this.http.get<IUserContactInfo>(`${environment.awork.url}/me`, { headers: this.header })
    }
}