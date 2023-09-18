import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ChromeStorageService } from '../services/chromeService.service';
import { ApiService } from '../services/api.service';
import { HttpClientModule } from '@angular/common/http';
import { ISiteObject, IList, IProject, IUserContactInfo } from '../common/common.interface';
import { enumList } from '../common/common.enum';
import { NgIf } from '@angular/common';
@Component({
    standalone: true,
    selector: 'app-options',
    templateUrl: './options.component.html',
    styleUrls: ['./options.component.scss'],
    providers: [ApiService],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [HttpClientModule, NgIf],
})
export class OptionsComponent implements OnInit {

    public selectedSites: ISiteObject = {};
    public list: IList = enumList;
    public isLoggedIn: boolean = false;
    public userEmail: string = ''

    constructor(private chromeService: ChromeStorageService, private apiService: ApiService, private changeDetectorRef: ChangeDetectorRef) { }

    /*get selected checkbox value*/
    checkboxChange(event: Event, site: string) {
        const siteCheck = (event as CustomEvent).detail;
        this.selectedSites[site] = siteCheck
        this.chromeService.setStorageData({ allowedSites: this.selectedSites });
        this.changeDetectorRef.detectChanges(); // Manually trigger change detection
    }

    /*logout user*/
    async handleLogout() {
        const data = await this.chromeService.getStorageData();
        if (data.running_time) {
            this.stopTimer()
        }
        else {
            this.logout();
        }
    }

    /* get projects list */
    getProjects() {
        this.apiService.getProjects().subscribe((response: IProject[]) => {
            this.list.projects = response;
            const dropdownOptions = this.list.projects.map(project => ({ value: project.id, label: project.name, icon: "bell" }))

            // cannot use Element, HTMLElement, HTMLSelectElement because options is undefined or read-only for the types
            const dropdown: any = document.querySelector('#optionsProjectsDropdown')
            if (dropdown) {
                dropdown.options = dropdownOptions
            }
            this.changeDetectorRef.detectChanges()
        }, (error) => {
            if (error.status === 401) {
                this.isLoggedIn = false;
            } else { }
        }
        );
    }

    /*stop running time*/
    stopTimer() {
        this.apiService.endTimeEntry().subscribe(() => {
            this.chromeService.resetOnStopTimer()
            chrome.runtime.sendMessage({ action: 'timerStop' })
            this.logout();
        }, (error) => {
            if (error.status === 401) {
                this.isLoggedIn = false;
            } else { }
        }
        );
    }

    /*logout*/
    logout() {
        this.chromeService.setStorageData({ token: "" })
        chrome.runtime.sendMessage({ action: 'loggedOut' });
        this.isLoggedIn = false;
    }

    /* get loggedIn user */
    getLoggedInUser() {
        this.apiService.getLoggedInUser().subscribe((response: IUserContactInfo) => {
            const [user] = response?.userContactInfos
            this.userEmail = user?.value
        }, (error) => {
            if (error.status === 401) {
                this.isLoggedIn = false;
            } else { }
        }
        );
    }

    ngOnInit(): void {
        this.getInitialData();
    }

    /*get storage data*/
    async getInitialData() {
        const data = await this.chromeService.getStorageData();
        if (data?.token) {
            this.isLoggedIn = true;
        }
        this.getProjects();
        this.getLoggedInUser();
        this.selectedSites = data?.allowedSites || {};
        this.changeDetectorRef.detectChanges(); // Manually trigger change detection
    }

    /* set the default project on change event */
    projectChange(event: Event) {
        const selectedProject = (event as CustomEvent).detail?.value;
        this.chromeService.setStorageData({ 'defaultProject': selectedProject })
    }
}
