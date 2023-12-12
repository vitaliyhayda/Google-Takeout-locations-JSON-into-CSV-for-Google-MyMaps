const fs = require('fs');
const { getDistance } = require('geolib');
const { createObjectCsvWriter } = require('csv-writer');

const records = JSON.parse(fs.readFileSync('records.json', 'utf8')).locations;

const csvWriter = createObjectCsvWriter({
    path: 'output.csv',
    header: [{ id: 'lng', title: 'lng' }, { id: 'lat', title: 'lat' }]
});

const simpleBlacklist = [
    '35.68039, 139.74547',
    // ...
];

const blacklist = simpleBlacklist.map(item => {
    const [lat, lng] = item.split(', ').map(coordinate => coordinate.replace(/0+$/, ''));
    return { lat, lng };
});

const res = records.reduce((res, { serverTimestamp, latitudeE7, longitudeE7 }) => {
    const timestamp = new Date(serverTimestamp);
    const validTimestamp = serverTimestamp && !isNaN(timestamp) && timestamp >= new Date("2023-12-05T08:37:13.503Z");

    const newPoint = { lat: (latitudeE7 / 1e7).toString(), lng: (longitudeE7 / 1e7).toString() };    
    const isUnique = !res.some(({ lat, lng }) => getDistance({ lat: parseFloat(lat), lng: parseFloat(lng) }, { latitude: parseFloat(newPoint.lat), longitude: parseFloat(newPoint.lng) }) <= 15);
    
    const isBlacklisted = blacklist.some(({ lat, lng }) =>
        newPoint.lat.startsWith(lat) &&
        newPoint.lng.startsWith(lng));

    return validTimestamp && isUnique && !isBlacklisted ? [...res, newPoint] : res;
}, []);

csvWriter.writeRecords(res);