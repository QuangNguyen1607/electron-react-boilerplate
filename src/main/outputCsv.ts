import fs from 'fs'
import { Parser } from '@json2csv/plainjs';
import { TypeSelectedFile } from "../renderer/screens/compress-image/compress-image";
export default function outputCsv(event:any, files:TypeSelectedFile[], destinationFolder){
	const csvData = files.map((image)=> ({
		"nameProduct": image.name,
		"nameImage": `${image.nameFile}.${ image.type}`,
		'sku': image.sku
	}))
	const parser = new Parser({});
	const csv = parser.parse(csvData);
	fs.writeFile(`${destinationFolder}/output.csv`, csv, "utf8", (err) => {
		if (err) {
			console.error("Error writing CSV file:", err);
		} else {
			console.log("CSV file with image data has been created.");
		}
	});
}
