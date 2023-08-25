import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { IStartTimeBody } from "../popup/components/timer/timer.interface";

@Injectable({
    providedIn: 'root'
})
export class PopupService {
    public header: HttpHeaders;

    /* get token and set http header */
    constructor(
        private http: HttpClient,
    ) {
        this.header = new HttpHeaders({
            "Authorization": `Bearer ${environment.awork.token}`
        });
    }

    /* get projects lists and time entries */
    public getTimeEntries() {
        return this.http.get(`${environment.awork.url}/timeentries?pageSize=5`, { headers: this.header })
    }

    /* create time entry */
    public createTimeEntry() {
        return this.http.post(`${environment.awork.url}/timeentries`, {}, { headers: this.header })
    }

    /* start timer */
    public startTimeEntry(body: IStartTimeBody) {
        return this.http.post(`${environment.awork.url}/me/timetracking/start`, body, { headers: this.header })
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
        return this.http.get(`${environment.awork.url}/projects`, { headers: this.header })
    }

    /* get taks lists */
    public getTasks(project_id: string) {
        return this.http.get(`${environment.awork.url}/projects/${project_id}/projecttasks`, { headers: this.header })
    }

    /* get work types */
    public getTypeOfWork() {
        return this.http.get(`${environment.awork.url}/typeofwork`, { headers: this.header })
    }
}
