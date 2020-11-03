/* For debugging purposes only */
const fs = require('fs');
const Apify = require('apify');
const { parse } = require('json2csv');

Apify.main(async () => {
    const dataset = await Apify.openDataset();
    const data = await dataset.getData();
    const csv = parse(data.items);
    fs.writeFileSync('./output.csv', csv);
});
