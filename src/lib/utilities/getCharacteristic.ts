import { brUuid } from "../constants"

const getCharacteristic = async (service : BluetoothRemoteGATTService, brUuidIndex: number) => {
    try {
        return await service.getCharacteristic(brUuid[brUuidIndex]);
    } catch (e: any) {
        console.log(`error trying to get characteristic! index: ${brUuidIndex}, value :${brUuid[brUuidIndex]}`, e);
        throw e;
    }
}

export { getCharacteristic }