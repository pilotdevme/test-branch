import { ISelectedValues, IList, ITime, ITimeDifference, IProjectDetail,ITimeTrackingSetting } from "./common.interface";

export const enumList : IList = {
    projects : [],
    tasks : [],
    workTypes : []
}

export const enumChangeList : ISelectedValues = {
    project:'',
    task:'',
    typeOfWork:'',
    isBillable:false
}

export const enumTime : ITime = {
    hours:0,
    minutes:0,
    seconds:0
}

export const enumTimeDifference : ITimeDifference = {
    hour:0,
    minute:0,
    second:0
}

export const initialTimerValue: string = '00:00:00';

export const enumProjectDetail : IProjectDetail = {
    projectStatus : {
       type : ''
    }
}

export const enumTimeTrackingSetting : ITimeTrackingSetting = {
    preventDoneProjects : false,
    preventPrivate : false,
    trackingLimit : false,
}

export const POPUP_ENTRIES  = 4