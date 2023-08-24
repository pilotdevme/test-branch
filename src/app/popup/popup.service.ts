import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { environment } from "src/environments/environment";

@Injectable({
    providedIn: 'root'
})
export class PopupService {
    public header: any;

    constructor(
        private http: HttpClient,
    ) {
        this.header = new HttpHeaders({
            // "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMWYzZDk2OC1mZTdmLTRlM2YtYjEzZC0yNWMyODRmZDIzZWQiLCJuYW1lIjoicmF2ZXJtYS5tZUBnbWFpbC5jb20iLCJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9lbWFpbGFkZHJlc3MiOiJyYXZlcm1hLm1lQGdtYWlsLmNvbSIsImlpZCI6IjExZjNkOTY4LWZlN2YtNGUzZi1iMTNkLTI1YzI4NGZkMjNlZCIsIndpZCI6IjNjOWRiZjRlLWI5ZTQtNDg4NS04ODg5LWNkMzM5NjQ1NjBjYyIsInVpZCI6IjhiMGVlNWE2LTQwZDQtNDA1Ny1hMzE5LWFlMDAzNjA1NzRlNSIsInNjb3BlIjoib2ZmbGluZV9hY2Nlc3MiLCJhenAiOiJhd29yay1leHQiLCJ0b2tlbl91c2FnZSI6ImFjY2Vzc190b2tlbiIsImNmZF9sdmwiOiJwcml2YXRlIiwibmJmIjoxNjkyNzcyMjgwLCJleHAiOjE2OTI4NTg2ODAsImlzcyI6Imh0dHBzOi8vYXBpLmF3b3JrLmlvLyIsImF1ZCI6ImF3b3JrLmlvIn0.-UFxILCmCA6utz71XFtkP3VNrQL_gHkvmId9QwcKYSM"
        });
    }

    public getTimeEntries() {
        let result = this.http.get(`${environment.awork.url}/timeentries`, { headers: this.header })
        console.log("result", result)
        return result
    }

    public createTimeEntry() {
        return this.http.post(`${environment.awork.url}/timeentries`, {}, { headers: this.header })
    }

    public startTimeEntry(body: {
        "isBillable": boolean,
        "isBilled": boolean,
        "taskId": string,
        "projectId": string,
        "note": string,
        "typeOfWorkId": string,
        "timezone": string
    }) {
        return this.http.post(`${environment.awork.url}/me/timetracking/start`, body, { headers: this.header })
    }

    public endTimeEntry() {
        return this.http.post(`${environment.awork.url}/me/timetracking/stop`, {}, { headers: this.header })
    }

    public deleteTimeEntry() {
        return this.http.post(`${environment.awork.url}/me/timetracking/delete`, {}, { headers: this.header })
    }

    public timeTrackingSettings() {
        return this.http.get(`${environment.awork.url}/timetracking/settings`, { headers: this.header })
    }

    public setWorkType() {
        return this.http.post(`${environment.awork.url}/timeentries/settypeofwork`, { headers: this.header })
    }

    public getProjects() {
        return this.http.get(`${environment.awork.url}/projects`, { headers: this.header })
    }

    public getTasks(project_id: any) {
        return this.http.get(`${environment.awork.url}/projects/${project_id}/projecttasks`, { headers: this.header })
    }

    public getTypeOfWork() {
        return this.http.get(`${environment.awork.url}/typeofwork`, { headers: this.header })
    }
}
