export interface IList {
    projects: IProject[],
    tasks: ITask[],
    workTypes: IWorkType[]
}

export interface ISelectedValues {
    project: string
    task: string
    typeOfWork: string
    isBillable: boolean
}

export interface ITime {
    hours: number
    minutes: number
    seconds: number
}

export interface ITimeDifference {
    hour: number,
    minute: number,
    second: number
}

export interface IProject {
    id: string,
    name: string,
    isBillableByDefault: boolean,
    projectStatus:{
        type : string
    }
}

export interface ITask {
    id: string,
    name: string
}

export interface IWorkType {
    id: string,
    name?: string
}

export interface IGetToken {
    access_token: string,
}

export interface ITimeEntry {
    project: IProject,
    task: ITask,
    createdOn: string,
    startTimeLocal: string,
    endTimeLocal: string,
    duration: string | number,
    note: string,
    startDateLocal : string,
    endDateLocal : string
}

export interface IStartTimeBody {
    isBillable?: boolean,
    isBilled?: boolean,
    taskId?: string,
    projectId?: string,
    note?: string,
    typeOfWorkId?: string,
    timezone: string
}
export interface ILocalData {
    running_time?: boolean,
    timer_start_time?: number,
    token?: string,
    defaultProject?:string
    selectedValues? : ISelectedValues
    note?:string
    projectStatus?:string
}
export interface IAllowedSites {
    [key: string]: ISiteObject
}

export interface ISiteObject {
    [key: string]: boolean
}
export interface IAccessTokenBody {
    code: string,
    client_id: string,
    redirect_uri: string,
    grant_type: string,
}

export interface IUserContactInfo {
    userContactInfos: { value: string }[]
}

export interface IProjectDetail {
    projectStatus : {
        type : string
    }
}

export interface ITimeTrackingSetting {
    preventDoneProjects : boolean,
    preventPrivate : boolean,
    trackingLimit : boolean,
}