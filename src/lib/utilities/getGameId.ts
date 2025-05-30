import { cfg_cmd_get_gameid } from "$lib/constants";
import { getCharacteristic } from ".";

const getGameId = async (service: BluetoothRemoteGATTService) => {
    var cmd_chrc = await getCharacteristic(service, 7);
    await cmd_chrc.writeValue(new Uint8Array([cfg_cmd_get_gameid]));
    const value = await cmd_chrc.readValue();
    let enc = new TextDecoder("utf-8");
    let gameid = enc.decode(value).replace(/[^0-9a-z_-]/gi, '');
    return gameid;
}

export { getGameId }