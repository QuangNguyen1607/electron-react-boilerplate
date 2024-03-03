import React, { useEffect, useRef, useState } from 'react';
import remote, { OpenDialogReturnValue } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { bytesToMB, extractFileTypeFromMimeType, sanitizeTitle } from '../../../helper/helper';
import toast, { Toaster } from 'react-hot-toast';
import { TYPE_FILE } from '../../../Types/General';
import { geoTag } from '@/src/main/preload';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@/src/components/ui/tabs';
import FormConfig from './components/form-config';
import { Button } from '@/src/components/ui/button';
import { ChevronDown, Loader2, MoveRight, Upload, X } from 'lucide-react';
import { Input } from '@/src/components/ui/input';
import { Progress } from '@/src/components/ui/progress';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/src/components/ui/collapsible';
import { Checkbox } from '@/src/components/ui/checkbox';
import { cn } from '@/lib/utils';
export interface TypeSelectedFile {
	id: string;
	name: string;
	src: string;
	path: string;
	size: number;
	sku: number;
	nameFile: string;
	type: string;
}

export default function CompressImages() {
	// @note Declare State
	const [selectedFiles, setSelectedFiles] = useState<TypeSelectedFile[]>([]);
	const [destinationFolder, setDestinationFolder] = useState('');
	const [initTotalSize, setInitTotalSize] = useState(0);
	const [savedTotalSize, setSavedTotalSize] = useState(0);
	const [typeFile, setTypeFile] = useState('keep');
	const [widthImage, setWidthImage] = useState(1920);
	const [heightImage, setHeightImage] = useState(1080);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingUploadFile, setIsLoadingUploadFile] = useState(false);
	const [errorFile, setErrorFile] = useState([]);
	const [quality, setQuality] = useState(80);
	const [stepProcess, setStepProcess] = useState(0);
	const [abortController, setAbortController] = useState(null);
	const [outputCsv, setOutputCsv] = useState(false);
	const [isOpenAdvanced, setIsOpenAdvanced] = React.useState(false);

	const [config, setConfig] = useState<geoTag>({
		lat: '',
		country: '',
		creator: '',
		description: '',
		long: '',
	});

	// @note Declare Function Handle
	const checkDuplicateArr = (array: TypeSelectedFile[], property: string) => {
		if (!array.length) return [];
		const arrIsFiltedDuplicate = new Set();
		return array.filter((item) => {
			const value = item[property];
			if (!arrIsFiltedDuplicate.has(value)) {
				arrIsFiltedDuplicate.add(value);
				return true;
			} else {
				return false;
			}
		});
	};
	// @note Handle Compress Image
	const handleCompressImage = async () => {
		const controller = new AbortController();
		setAbortController(controller);
		//
		if (!destinationFolder) {
			toast.error('You forget set output folder');
			return;
		}
		setIsLoading(true);
		setStepProcess(0);
		const isLoading = toast.loading('Loading...');
		try {
			const result = {
				compressedFileSizes: [],
				errorFile: [],
			};
			for (const file of selectedFiles) {
				if (controller.signal.aborted) {
					setIsLoading(false);
					setAbortController(null);
					toast.dismiss(isLoading);
					return;
				}
				const resultImage = await window.electron.compressImages({
					destinationFolder: destinationFolder,
					files: [file],
					typeFile: typeFile,
					width: widthImage,
					height: heightImage,
					quality: quality,
					geoTag: config,
				});
				setStepProcess((prevStep) => prevStep + 1);
				if (resultImage.success) {
					result.compressedFileSizes.push(
						resultImage.compressedFileSizes.shift(),
					);
				} else {
					result.errorFile.push(resultImage.errorFile.shift());
				}
			}
			const savedTotalSize = result?.compressedFileSizes?.reduce(
				(total, file) => (total += file.compressedSize),
				0,
			);
			if (result?.errorFile) {
				setErrorFile(result.errorFile);
			}
			//
			window.electron.openFolder(destinationFolder);
			window.electron.showNotification({
				title: 'All in one tools',
				body: 'Image Compress Successfully',
			});
			if(outputCsv){
				try {
					window.electron.outputCsv(selectedFiles, destinationFolder);
				} catch (error) {
					console.log(error)
				}
			}
			//
			setSavedTotalSize(bytesToMB(savedTotalSize));
			toast.success('Compress Image Successfully');
			setIsLoading(false);
			setAbortController(null);
			toast.dismiss(isLoading);
		} catch (error) {
			toast.error('Error Compress Image');
			setIsLoading(false);
			setAbortController(null);
			toast.dismiss(isLoading);
		}
	};
	const handleCancel = () => {
		if (abortController) {
			abortController.abort();
		}
	};

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		setIsLoadingUploadFile(true);
		const files = event.target.files;
		if (files) {
			const fileArray: TypeSelectedFile[] = Array.from(files)
				.map((file) => {
					if (file?.path.endsWith('.svg')) {
						toast.error(`Can't upload type file svg: ${file.name}`);
						return null;
					}
					return {
						id: uuidv4(),
						name: file.name.slice(0, file.name.lastIndexOf('.')),
						path: file.path,
						size: file.size,
						src: URL.createObjectURL(file), // Create a blob URL for each file
						type: extractFileTypeFromMimeType(file.type), // Create a blob URL for each file
					};
				})
				.filter((file) => file !== null);
			const filePaths = Array.from(files).map((file) => ({
				name: file.name,
				path: file.path,
			}));
			const arrayIsFiltered = checkDuplicateArr(
				[...selectedFiles, ...fileArray],
				'path',
			);
			setSelectedFiles(arrayIsFiltered);
		}
		setIsLoadingUploadFile(false);
	};
	const handleFileDelete = (id: string) => {
		setSelectedFiles(selectedFiles.filter((item) => item.id != id));
	};
	// @note Handle File Name
	const handleFileName = (
		id: string,
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
		const changeNameById: TypeSelectedFile[] = selectedFiles.map((item) => {
			if (item.id == id) {
				return {
					...item,
					name: e.target.value,
					nameFile: sanitizeTitle(e.target.value),
				};
			}
			return item;
		});
		setSelectedFiles(changeNameById);
	};

	// Make sure to revoke the object URLs to avoid memory leaks
	React.useEffect(() => {
		return () => {
			selectedFiles.forEach((file) => URL.revokeObjectURL(file.src));
		};
	}, [selectedFiles]);

	// Set Destination Folder
	const handleSetDestinationFolder = async () => {
		const folderPath: OpenDialogReturnValue =
			await window.electron.showOpenDialog();
		if (!folderPath.canceled) {
			const destinationFolder = folderPath.filePaths[0];
			setDestinationFolder(destinationFolder);
		}
	};

	// Handle Generate Title
	type NameInput = 'imageTitle' | 'imageTitleSuffix' | 'imageTitleSku';
	const imageTitleRef = useRef('');
	const imageTitleSuffixRef = useRef('');
	const imageTitleSkuRef = useRef(0);
	const handleGenerateTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
		const isNameInput: NameInput = e.target.name as NameInput;
		const value = e.target.value;
		switch (isNameInput) {
			case 'imageTitle':
				imageTitleRef.current = value;
				break;
			case 'imageTitleSku':
				imageTitleSkuRef.current = parseFloat(value);
				break;
			case 'imageTitleSuffix':
				imageTitleSuffixRef.current = value;
				break;
		}
		if (!selectedFiles.length) return;
		const selectedFileFormat = selectedFiles.map((item, index) => {
			let nameFile = `${imageTitleRef.current}`;
			if (imageTitleSuffixRef.current) {
				nameFile += ` ${imageTitleSuffixRef.current}`;
			}
			if (imageTitleSkuRef.current) {
				nameFile += `${imageTitleSkuRef.current + index}`;
			}
			return {
				...item,
				name: nameFile,
				nameFile: sanitizeTitle(nameFile),
				sku: imageTitleSkuRef.current + index,
			};
		});
		setSelectedFiles(selectedFileFormat);
	};
	useEffect(() => {
		// if (!selectedFiles.length) return;
		const totalSize = selectedFiles.reduce(
			(total, file) => (total += file.size),
			0,
		);
		setInitTotalSize(bytesToMB(totalSize));
	}, [selectedFiles]);
	//
	const handleReset = () => {
		setSelectedFiles([]);
		setDestinationFolder('');
		setInitTotalSize(0);
		setSavedTotalSize(0);
		setStepProcess(0);
		setErrorFile([]);
	};

	// Handle Info Geo Tag
	const handleconfig = (e: React.ChangeEvent<HTMLInputElement>) => {
		const name = e.target.name;
		const value = e.target.value;
		setConfig((prevConfig) => ({
			...prevConfig,
			[name]: value,
		}));
	};
	useEffect(() => {
		const configStore = window.electron.store.get('config');
		if (configStore) {
			setConfig(configStore);
		}
	}, []);
	return (
		<div className="">
			<Tabs defaultValue="general">
				<div className="wrap-tab bg-foreground w-full p-2 rounded-3xl">
					<TabsList className="bg-transparent">
						<TabsTrigger value="general">General</TabsTrigger>
						<TabsTrigger value="config">
							Config MetaData
						</TabsTrigger>
					</TabsList>
				</div>
				<TabsContent value="general" className="mt-5">
					<div className="grid grid-cols-12 gap-5">
						<div
							className={`${selectedFiles.length < 1 ? 'col-span-12' : 'col-span-9'}`}
						>
							{!!selectedFiles?.length && isLoading && (
								<>
									<div className="wrap-processing-bar p-5 rounded-3xl relative">
										<Progress
											value={
												(stepProcess /
													selectedFiles?.length) *
												100
											}
										/>
										<div className="wrap-text absolute top-1/2 -translate-x-1/2 -translate-y-1/2 left-1/2 text-xs font-medium text-black">
											{stepProcess} /{' '}
											{selectedFiles?.length}
										</div>
									</div>
									<Button
										className="mb-5"
										variant={'delete'}
										onClick={handleCancel}
									>
										Cancel Compress
									</Button>
								</>
							)}
							<div className="wrap-tab-general bg-foreground p-5 rounded-3xl">
								<div className="wrap-input-images relative w-full h-[150px] flex items-center justify-center bg-background rounded-2xl border-2 border-dashed border-primary flex-col cursor-pointer hover:bg-black/60 transition-all group">
									<input
										className="opacity-0 absolute top-0 left-0 w-full h-full z-50 cursor-pointer"
										type="file"
										accept="image/*"
										multiple
										onChange={handleFileChange}
									/>
									<Upload
										className="group-hover:animate-bounce"
										size={32}
									/>
									<p className="uppercase font-bold mt-3">
										Add Item Image
									</p>
								</div>
								{!!errorFile.length && (
									<div className="error-file bg-background rounded-2xl p-5 mt-5">
										<div className="text-lg font-medium text-red-400 mb-2">
											Error File
										</div>
										<ul>
											{errorFile.map((item, index) => (
												<li key={index}>{item}</li>
											))}
										</ul>
									</div>
								)}
								{/* @note Show list image  */}
								{selectedFiles.length > 0 && (
									<div className="grid grid-cols-4 gap-5 mt-10">
										{Array.from(selectedFiles).map(
											(item, index) => (
												<div
													className="flex flex-col gap-2 relative"
													key={item.id}
												>
													<div className="img aspect-square flex items-center justify-center bg-foregroundLighten relative">
														<img
															className="max-w-full max-h-full w-full object-contain absolute"
															src={item.src}
															alt={item.name}
														/>
													</div>
													<div
														className="close w-5 h-5 bg-red-500 flex items-center justify-center rounded-full absolute top-0 right-0 z-20 cursor-pointer translate-x-1/2 -translate-y-1/2 hover:bg-red-700 transition-all"
														onClick={() =>
															handleFileDelete(
																item.id,
															)
														}
													>
														<X size={14} />
													</div>
													<Input
														type="text"
														placeholder="Name"
														value={item.name}
														onChange={(e) =>
															handleFileName(
																item.id,
																e,
															)
														}
													/>
													<Input
														type="text"
														placeholder="Name File"
														value={sanitizeTitle(
															item.name,
														)}
														onChange={(e) =>
															handleFileName(
																item.id,
																e,
															)
														}
													/>
													<Input
														type="text"
														disabled
														value={item.sku}
													></Input>
												</div>
											),
										)}
									</div>
								)}
							</div>
						</div>
						<div
							className={`col-span-3 ${selectedFiles.length < 1 ? 'hidden' : ''}`}
						>
							<div className="bg-foreground p-5 rounded-3xl">
								<div className="totalSize">
									<p className="font-bold text-lg flex gap-2 items-center">
										Size:{' '}
										<span className="text-white">
											{initTotalSize} MB
										</span>
										{!!savedTotalSize && (
											<span className="flex gap-2 items-center text-primary">
												<MoveRight />
												<span>{savedTotalSize} MB</span>
											</span>
										)}
									</p>
								</div>
								<hr />
								<div className="wrap flex flex-col gap-2">
									<div className="text-primary font-medium mb-1">
										Image Dimenssions
									</div>
									<label className="text-sm mb-1 font-medium">
										Max-width
									</label>
									<Input
										type="number"
										name="width"
										value={widthImage}
										onChange={(e) =>
											setWidthImage(
												parseFloat(e.target.value),
											)
										}
									/>
									<label className="text-sm mb-1 font-medium">
										Max-height
									</label>
									<Input
										type="number"
										name="height"
										value={heightImage}
										onChange={(e) =>
											setHeightImage(
												parseFloat(e.target.value),
											)
										}
									/>
									<label className="text-sm mb-1 font-medium">
										Type file
									</label>
									<select
										name="typeFile"
										className="flex h-10 w-full rounded-md border border-foregroundLighten bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
										id=""
										onChange={(e) =>
											setTypeFile(e.target.value)
										}
									>
										<option value={TYPE_FILE.KEEP}>
											Keep Type
										</option>
										<option value={TYPE_FILE.WEBP}>
											Webp
										</option>
										<option value={TYPE_FILE.PNG}>
											PNG
										</option>
										<option value={TYPE_FILE.JPG}>
											JPG
										</option>
										<option value={TYPE_FILE.AVIF}>
											AVIF
										</option>
									</select>
									<label className="text-sm mb-1 font-medium">
										Image Quality
									</label>
									<Input
										type="text"
										placeholder="Quality"
										value={quality}
										name="imageTitle"
										onChange={() => setQuality(quality)}
									/>
								</div>
								<hr />
								<div className="wrap flex flex-col gap-2 mb-3">
									<div className="text-primary font-medium mb-1">
										Generate Title
									</div>
									<label className="text-sm mb-1 font-medium">
										Image Title
									</label>
									<Input
										type="text"
										placeholder="Image Title"
										defaultValue={imageTitleRef.current}
										name="imageTitle"
										onChange={handleGenerateTitle}
									/>
									<label className="text-sm mb-1 font-medium">
										Suffix
									</label>
									<Input
										type="text"
										placeholder="Suffix"
										name="imageTitleSuffix"
										defaultValue={imageTitleSuffixRef.current}
										onChange={handleGenerateTitle}
									/>
									<label className="text-sm mb-1 font-medium">
										Sku
									</label>
									<Input
										type="number"
										placeholder="Sku"
										defaultValue={imageTitleSkuRef.current}
										name="imageTitleSku"
										onChange={handleGenerateTitle}
									/>
								</div>
								<hr />
								<div className="wrap-geo-tag flex flex-col gap-2">
									<div className="text-primary font-medium mb-1">
										Geo Tag
									</div>
									<label className="text-sm mb-1 font-medium">
										Lat
									</label>
									<Input
										type="text"
										placeholder="Lat"
										name="lat"
										value={config?.lat}
										onChange={handleconfig}
									/>
									<label className="text-sm mb-1 font-medium">
										Long
									</label>
									<Input
										type="text"
										placeholder="Long"
										name="long"
										value={config?.long}
										onChange={handleconfig}
									/>
									<label className="text-sm mb-1 font-medium">
										Description
									</label>
									<Input
										type="text"
										placeholder="Description"
										name="description"
										value={config?.description}
										onChange={handleconfig}
									/>
									<label className="text-sm mb-1 font-medium">
										Country
									</label>
									<Input
										type="text"
										placeholder="Country"
										name="country"
										value={config?.country}
										onChange={handleconfig}
									/>
									<label className="text-sm mb-1 font-medium">
										Creator
									</label>
									<Input
										type="text"
										placeholder="Creator"
										name="creator"
										value={config?.creator}
										onChange={handleconfig}
									/>
								</div>
								<hr />
								<div className="wrap">
									<Button
										variant="secondary"
										className="w-full my-2"
										onClick={handleSetDestinationFolder}
									>
										Chossen Output Folder
									</Button>
									{destinationFolder && (
										<div className=" w-full p-3 bg-foregroundLighten rounded-lg text-sm min-h-10 mb-2">
											<p className="line-clamp-2 break-words">
												{destinationFolder}
											</p>
										</div>
									)}
								</div>
								<hr />
								<div className="wrap-option-advanced">
									<Collapsible
										open={isOpenAdvanced}
										onOpenChange={setIsOpenAdvanced}
									>
										<CollapsibleTrigger className="w-full pb-4 pt-0">
											<div className="flex items-center justify-between w-full text-primary font-medium">
												<span>Option Advanced</span>
												<ChevronDown
													className={cn(
														'transition-all',
														isOpenAdvanced &&
															'rotate-180',
													)}
												/>
											</div>
										</CollapsibleTrigger>
										<CollapsibleContent>
											<div className="flex items-center space-x-2 mt-2 mb-4">
												<Checkbox
													id="openAdvanced"
													onChange={() =>
														setOutputCsv(
															(prev) => !prev,
														)
													}
												></Checkbox>
												<label
													htmlFor="openAdvanced"
													className="select-none"
												>
													Output file csv (name, sku,
													nameImage)
												</label>
											</div>
										</CollapsibleContent>
									</Collapsible>
								</div>
								<div className="wrap flex gap-2">
									<Button
										variant="delete"
										onClick={handleReset}
									>
										Reset
									</Button>
									<Button
										disabled={isLoading}
										onClick={handleCompressImage}
										className="flex-1"
									>
										{isLoading && (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										)}
										Run Compress Image
									</Button>
								</div>
							</div>
						</div>
					</div>
				</TabsContent>
				<TabsContent value="config">
					<FormConfig setConfig={setConfig}></FormConfig>
				</TabsContent>
			</Tabs>
		</div>
	);
}
