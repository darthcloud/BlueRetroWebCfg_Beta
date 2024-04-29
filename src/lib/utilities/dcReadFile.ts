import { brUuid, vmuSize } from "$lib/constants.js";


const dcReadFile = async (
    service: BluetoothRemoteGATTService, 
    setProgress: (percent: number) => void, 
    cancellationToken: ICancellationToken
) => {
    var data = new Uint8Array(vmuSize);
   
    const offset = new Uint32Array(1);
    let ctrl_chrc = await service.getCharacteristic(brUuid[10]);
    offset[0] = 0;
    await ctrl_chrc.writeValue(offset);
    const chrc = await service.getCharacteristic(brUuid[11]);
    await dcReadFileRecursive(chrc, data, 0, setProgress, cancellationToken);
    offset[0] = 0;
    await ctrl_chrc.writeValue(offset);

    return data;
  };

const dcReadFileRecursive = async (
    chrc: BluetoothRemoteGATTCharacteristic, 
    data: Uint8Array, 
    offset: number, 
    setProgress: (percent: number) => void, 
    cancellationToken: ICancellationToken
) => {
        if (cancellationToken.isCanceled) {
            throw new Error("Cancelled");
        }
        setProgress(Math.round((offset / vmuSize) * 100));
        const value = await chrc.readValue();

        const tmp = new Uint8Array(value.buffer);
        data.set(tmp, offset);
        offset += value.byteLength;
        if (offset < vmuSize) {
            return await dcReadFileRecursive(chrc, data, offset, setProgress, cancellationToken);
        }
        return data;
        
  };

  export { dcReadFile };