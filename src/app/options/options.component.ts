import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ChromeStorageService } from 'src/app/services/chromeService.service';
import { ApiService } from 'src/app/services/api.service';
import { ISiteObject, IList, IProject, IUserContactInfo, ITimeTrackingSetting } from 'src/app/common/common.interface';
import { enumList, enumTimeTrackingSetting } from 'src/app/common/common.enum';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
@Component({
    standalone: true,
    selector: 'app-options',
    templateUrl: './options.component.html',
    styleUrls: ['./options.component.scss'],
    providers: [ApiService],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [HttpClientModule, NgIf, TranslateModule],
})
export class OptionsComponent implements OnInit {

    public selectedSites: ISiteObject = {};
    public list: IList = enumList;
    public isLoggedIn: boolean = false;
    public userEmail: string = ''
    public projectValue: string = '';   
    private timeTrackingSetting : ITimeTrackingSetting = enumTimeTrackingSetting;

    constructor(
        private chromeService: ChromeStorageService,
        private apiService: ApiService,
        private changeDetectorRef: ChangeDetectorRef,
        private translate: TranslateService
    ) {
        this.translate.setDefaultLang('en');
        this.translate.use('en');
    }

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
                dropdown.value = this.projectValue
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
        this.chromeService.resetOnLogout()
        this.chromeService.resetOnStopTimer();
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
        this.projectValue = data?.defaultProject ?? ''
        
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
        this.projectValue = (event as CustomEvent).detail?.value;
        this.chromeService.setStorageData({ 'defaultProject': this.projectValue })
    }
}
