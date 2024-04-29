import type { IBlueRetroFile } from "./IBlueRetroFile";

export interface IDeviceConfig {
    appName?: string;
    bluetoothAddress?: string;
    appVersion?: string;
    globalConfig?: IGlobalConfig;
    files?: IBlueRetroFile[];
    source?: ControllerConfigType;
}

export interface IGlobalConfig {
    apiVersion: number;
    system: number;
    multitap: number;
    inquiryMode?: number;
    bank?: number
}