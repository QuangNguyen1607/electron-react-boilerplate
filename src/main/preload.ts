import { geoTag } from '@/src/main/preload';
// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, dialog, ipcRenderer, IpcRendererEvent } from 'electron';
import { TypeSelectedFile } from '../renderer/App';
import { ParamsShowNotification } from '../Types/General';

export type Channels = 'ipc-example';
export interface geoTag {
	lat: string;
	long: string;
	description: string;
	country: string;
	creator: string;
}
export interface ParamsCompressImage {
	files: TypeSelectedFile[];
	destinationFolder: String;
	typeFile: String;
	width?: Number;
	quality: Number;
	height?: Number;
	geoTag?: geoTag;
}
const electronHandler = {
	ipcRenderer: {
		sendMessage(channel: Channels, ...args: unknown[]) {
			ipcRenderer.send(channel, ...args);
		},
		on(channel: Channels, func: (...args: unknown[]) => void) {
			const subscription = (
				_event: IpcRendererEvent,
				...args: unknown[]
			) => func(...args);
			ipcRenderer.on(channel, subscription);

			return () => {
				ipcRenderer.removeListener(channel, subscription);
			};
		},
		once(channel: Channels, func: (...args: unknown[]) => void) {
			ipcRenderer.once(channel, (_event, ...args) => func(...args));
		},
	},
	compressImages: (imageObject: ParamsCompressImage) =>
		ipcRenderer.invoke('compress-image', imageObject),
	showOpenDialog: () => ipcRenderer.invoke('showOpenDialog'),
	showNotification: (noti: ParamsShowNotification) =>
		ipcRenderer.invoke('showNotification', noti),
	openFolder: (path: string) => ipcRenderer.invoke('openFolder', path),
	store: {
		get(key: string) {
			return ipcRenderer.sendSync('electron-store-get', key);
		},
		set(property: string, val: any) {
			ipcRenderer.send('electron-store-set', property, val);
		},
		// Other method you want to add like has(), reset(), etc.
	},
	outputCsv: (imageObject: ParamsCompressImage, destinationFolder) =>
		ipcRenderer.invoke('outputCSV', imageObject, destinationFolder),
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
