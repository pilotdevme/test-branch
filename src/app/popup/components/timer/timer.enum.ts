import { ISelectedValues, IList, ITime, ITimeDifference } from "./timer.interface";

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

export const initialTimerValue: string = '00:00:00'