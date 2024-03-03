import { dialog, shell, Notification } from 'electron';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { ParamsCompressImage } from './preload';
import { ExifTool } from 'exiftool-vendored';
const exiftool = new ExifTool();

export function compressImages(
	event: any,
	{
		files,
		destinationFolder,
		typeFile,
		width = 1920,
		height = 1080,
		geoTag,
		quality,
	}: ParamsCompressImage,
) {
	return new Promise(async (resolve, reject) => {
		try {
			const compressedFileSizes = [];
			const errorFile = [];
			for (const file of files) {
				try {
					let format;
					if (typeFile == 'keep') {
						format = path.extname(file.path).slice(1); // Extract the file extension without the dot
					} else {
						format = typeFile; // Use the specific format provided by fileType
					}
					const outputPath = path.join(
						destinationFolder,
						`${path.basename(file.nameFile, path.extname(file.nameFile))
							}.${format}`, // For example, converting to WebP
					);
					await sharp(file.path)
						.resize({
							width: parseFloat(width),
							height: parseFloat(height),
							fit: 'inside',
							withoutEnlargement: true,
						})
						.toFormat(format)
						.jpeg({
							quality: quality,
							progressive: true,
							force: false,
						})
						.png({
							quality: quality,
							progressive: true,
							force: false,
						})
						.webp({
							force: false,
							quality: quality,
						})
						.toFile(outputPath)
						.then((info) => {
							compressedFileSizes.push({
								fileName: path.basename(file.name),
								compressedSize: info.size,
							});
						});
					await exiftool.write(
						outputPath,
						{
							GPSLatitude: geoTag?.lat,
							GPSLongitude: geoTag?.long,
							Description: geoTag?.description,
							Country: geoTag?.country,
							Creator: geoTag?.creator,
						},
						['-overwrite_original'],
					);
				} catch (error) {
					console.error(`Error processing file: ${file.name}`, error);
					errorFile.push(file.name);
				}
			}
			resolve({
				success: !errorFile.length,
				message: !errorFile.length ? 'Images compressed successfully.' : 'Images compressed fail.' ,
				compressedFileSizes,
				errorFile,
			});
		} catch (error) {
			console.error(error);
			reject({
				success: false,
				message: 'Error compressing images.',
			});
		}
	});
}
