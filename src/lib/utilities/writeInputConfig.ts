import { brUuid } from "$lib/constants";

const presetWriteRecursive = async (
	cfg: Uint8Array,
	inputCtrl: Uint16Array,
	ctrl_chrc: BluetoothRemoteGATTCharacteristic,
	data_chrc: BluetoothRemoteGATTCharacteristic
) => {
	await ctrl_chrc.writeValue(inputCtrl);
	var tmpViewSize = cfg.byteLength - inputCtrl[1];
	if (tmpViewSize > 512) {
		tmpViewSize = 512;
	}
	var tmpView = new DataView(cfg.buffer, inputCtrl[1], tmpViewSize);
	await data_chrc.writeValue(tmpView);
	inputCtrl[1] += 512;
	if (inputCtrl[1] < cfg.byteLength) {
		await presetWriteRecursive(cfg, inputCtrl, ctrl_chrc, data_chrc);
	}
}

const writeInputConfig = async (input: number, cfg: Uint8Array, service: BluetoothRemoteGATTService) => {
	let ctrl_chrc = await service!.getCharacteristic(brUuid[4]);
	const data_chrc = await service!.getCharacteristic(brUuid[5]);
	const inputCtrl = new Uint16Array([input, 0]);
	await presetWriteRecursive(cfg, inputCtrl, ctrl_chrc, data_chrc);
}

export { writeInputConfig }