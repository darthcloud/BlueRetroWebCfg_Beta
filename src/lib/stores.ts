import { derived, writable } from 'svelte/store';
import type { IDeviceConfig } from '$lib/interfaces';

const device = writable<BluetoothDevice | undefined>();
const service = writable<BluetoothRemoteGATTService | undefined>();
const deviceConfig = writable<IDeviceConfig | undefined>();
const latestVersion = writable<string | undefined>();

const isFullyInitialized = derived([device, service, deviceConfig], ([$device, $service, $deviceConfig]) =>
    !!$service && !!$deviceConfig && !!$device
);

export { device, deviceConfig, service, isFullyInitialized, latestVersion }