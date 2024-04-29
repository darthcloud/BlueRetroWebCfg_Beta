import { brUuid } from "$lib/constants";

const getDevice = async (): Promise<BluetoothDevice> => {
    console.log('Requesting Bluetooth Device...');
    const d = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'BlueRetro' }],
        optionalServices: [brUuid[0]]
    });
    return d;
};

export { getDevice }