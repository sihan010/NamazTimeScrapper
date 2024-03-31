var lineReader = require("line-reader");
const syncfs = require("fs");

// https://download.geonames.org/export/dump/
// Download data by country, extract txt files and place in {raw_data_foler}
// Open folder, parse each txt file to json

let raw_data_foler = "geonames_data";
let result_data_foler = "geonames_parsed_data";

const getData = async (countryCode) => {
  let data = [];
  lineReader.eachLine(
    `./${raw_data_foler}/${countryCode}.txt`,
    (line, last) => {
      let elements = line.split("\t");
      data.push({
        geoNameId: parseInt(elements[0]),
        utf8Name: elements[1],
        asciiName: elements[2],
        alternateNames: elements[3].split(","),
        latitude: parseFloat(elements[4]),
        longitude: parseFloat(elements[5]),
        countryCode: elements[8],
        population: parseInt(elements[13]),
        timeZone: elements[17],
        modificationdate: elements[18],
      });

      if (last) {
        // if this is last line
        if (!syncfs.existsSync(`./${result_data_foler}`)) {
          syncfs.mkdirSync(`./${result_data_foler}`, { recursive: true });
        }
        syncfs.writeFileSync(
          `./${result_data_foler}/${countryCode}_area_data.json`,
          JSON.stringify(data, null, 4)
        );
      }
    }
  );
};

getData("BD"); // read file names from {raw_data_foler} and call this method from loop
