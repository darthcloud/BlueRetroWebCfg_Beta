import { brUuid, cfg_cmd_get_fw_name } from "$lib/constants";
import type { IDeviceConfig } from "$lib/interfaces";

const getAppVersion = async (service: BluetoothRemoteGATTService) => {
    console.log('Reading App version...');
    const charactristics = await service.getCharacteristic(brUuid[9]);
    let enc = new TextDecoder('utf-8');
    let app_ver = enc.decode(await charactristics.readValue());
    console.log('App Version: ', app_ver);
    return app_ver;
};

const getAppName = async (service: BluetoothRemoteGATTService, command: number) => {
    console.log('Reading App Name...');
    var cmd = new Uint8Array(1);
    var cmd_chrc = await service.getCharacteristic(brUuid[7]);
    cmd[0] = command;
    await cmd_chrc.writeValue(cmd);
    const dataview = await cmd_chrc.readValue();
    let enc = new TextDecoder('utf-8');
    let commandString = enc.decode(dataview);
    console.log('App Name: ', commandString);
    return commandString;
};

const getBdAddr = async (service: BluetoothRemoteGATTService) => {
    console.log('Reading Bluetooth Address...');
    const charactristics = await service.getCharacteristic(brUuid[12]);
    const dataview = await charactristics.readValue();
    let address =
        dataview.getUint8(5).toString(16).padStart(2, '0') +
        ':' +
        dataview.getUint8(4).toString(16).padStart(2, '0') +
        ':' +
        dataview.getUint8(3).toString(16).padStart(2, '0') +
        ':' +
        dataview.getUint8(2).toString(16).padStart(2, '0') +
        ':' +
        dataview.getUint8(1).toString(16).padStart(2, '0') +
        ':' +
        dataview.getUint8(0).toString(16).padStart(2, '0');
    console.log('Bluetooth Address: ', address);
    return address;
};

const getDeviceConfiguration = async (s: BluetoothRemoteGATTService) => {
    const bluetoothAddress = await getBdAddr(s);
    const appVersion = await getAppVersion(s);

    const config: IDeviceConfig = {
        bluetoothAddress,
        appVersion
    };

    const app_ver_is_18x = appVersion.indexOf('v1.8') != -1;
    const app_ver_bogus = appVersion.indexOf('v') == -1;
    if (!app_ver_is_18x && !app_ver_bogus) {
        config.appName = await getAppName(s, cfg_cmd_get_fw_name);
        console.log(
            'Connected to: ' +
            config.appName +
            ' (' +
            config.bluetoothAddress +
            ') [' +
            config.appVersion +
            ']'
        );
    }
    return config;
};

export { getDeviceConfiguration }