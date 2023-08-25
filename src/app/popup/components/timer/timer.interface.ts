export interface IList {
    projects: IProject[],
    tasks: any[],
    workTypes: any[],
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
    isBillableByDefault: boolean
}

export interface ITimeEntry {
    project: IProject,
    createdOn: string,
    startTimeLocal: string,
    endTimeLocal: string,
    duration: string | number
}

export interface IStartTimeBody {
        isBillable: boolean,
        isBilled: boolean,
        taskId: string,
        projectId: string,
        note: string,
        typeOfWorkId: string,
        timezone: string
}