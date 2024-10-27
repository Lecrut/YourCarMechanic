// delete_pl_letters.js

import fs from 'fs';

const replacePolishChars = (str) => {
    const polishChars = {
        'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
    };
    return str.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, match => polishChars[match]).replace(" ", "_").toLowerCase();
};

const filePath = '../public/cities.json';

fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) throw err;

    let jsonData = JSON.parse(data);

    jsonData = jsonData.map(item => {
        item.value = replacePolishChars(item.city);
        return item;
    });

    jsonData.sort((a, b) => a.value.localeCompare(b.value));


    fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf-8', (err) => {
        if (err) throw err;
        console.log('Plik JSON został pomyślnie zaktualizowany!');
    });
});
