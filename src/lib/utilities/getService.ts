import { brUuid, maxConnectRetries } from '$lib/constants';
import { device, deviceConfig, service } from '$lib/stores';
import { get } from 'svelte/store';
import { getDevice } from './getDevice';
import { getDeviceConfiguration } from './getConfiguration';

const getGattService = async (
    device: BluetoothDevice,
    retry: number = 0,
    cancellationToken?: ICancellationToken
): Promise<BluetoothRemoteGATTService | undefined> => {

    if (retry < maxConnectRetries && !cancellationToken?.isCanceled) {
        try {
            if (!device.gatt?.connected) {
                console.log('Connecting to GATT Server...');
                await device.gatt?.connect();
            }
            if (device.gatt?.connected && !cancellationToken?.isCanceled) {
                console.log('Getting BlueRetro Service...');
                return await device.gatt.getPrimaryService(brUuid[0]);
            } else if(!cancellationToken?.isCanceled) {
                return await getGattService(device, retry + 1, cancellationToken);
            }
        } catch (error) {
            console.log('error connecting to gat service', error);
            if(!cancellationToken?.isCanceled) {
                return await getGattService(device, retry + 1, cancellationToken);
            }
        }
    } else {
        return undefined;
    }

};

const getService = async (retry: number = 0, cancellationToken?: ICancellationToken): Promise<BluetoothRemoteGATTService> => {
    let dev: BluetoothDevice | undefined;
    if (retry < maxConnectRetries && !cancellationToken?.isCanceled) {
        try {
            dev = get(device);
            if (!dev) {
                console.log('Getting device');
                dev = await getDevice();
                device.set(dev);
            }

            if (!dev.gatt) {
                throw new Error('Unable to get GATT server');
            }

            let serv = get(service);
            if ((!serv || !dev.gatt.connected)) {
                console.log('Getting new connection to GATT service');
                serv = await getGattService(dev, 0, cancellationToken);
                if (!serv) {
                    throw new Error('Unable to connect to the GATT service');
                }
                const config = await getDeviceConfiguration(serv);
                deviceConfig.set(config);
                service.set(serv);
                return serv;
            } else if(cancellationToken?.isCanceled) {
                throw new Error('Canceled');
            } 
            return serv;

        } catch (error) {
            if (dev && !cancellationToken?.isCanceled) {
                console.log('Error trying to establish connection to GATT service retrying...', error)
                return await getService(retry + 1, cancellationToken);
            }

        }
    }
    deviceConfig.set(undefined);
    device.set(undefined);
    service.set(undefined);
    if(!cancellationToken?.isCanceled) {
        throw new Error('Max connection retries exceeded');
    } else {
        throw new Error('Canceled');
    }
}

export { getService }