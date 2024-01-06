//Works with creating Database
//Works with creating table
//Works with the cron job
//Works with getting data from amfindia
//Works with converting data into array values
//Works with Inserting missing values
//Doesnot work - mf and sc numbers are not working properly
//Doesnot work - appends any data to the last, what if it is needed in the middle?

const axios = require('axios');
var mysql = require('mysql');
const cron = require('node-cron');
const cheerio = require('cheerio'); 
const mfId = 3;
const scId = 119551;
const fdate = '07-Dec-2023';
const tdate = '06-Jan-2024';


//Connect to mysql
var con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mutualfund'
});


//Check connection
con.connect(function(err) {
    if (err) {
        console.error('Error:', err.message);
    } else {
        console.log('Connected to the database.');

        // Create the navdata table
        var createTableSql = 'CREATE TABLE IF NOT EXISTS navdata (NAV VARCHAR(255), DATE VARCHAR(255))';
        con.query(createTableSql, function(err, result) {
            if (err) {
                console.error('Error:', err.message);
            } else {
                console.log('Table created successfully.');
            }
        });
    }
});



//Execute job every 2 seconds

cron.schedule("* * * * * *", function(){

    //cURL
    const url = 'https://www.amfiindia.com/modules/NavHistoryPeriod';
    const headers = {
        'Accept': '*/*', 
        'Accept-Language': 'en-US,en;q=0.9', 
        'Connection': 'keep-alive', 
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 
        'Cookie': '_fbp=fb.1.1704176441753.376228623; __utmc=57940026; __utmz=57940026.1704176442.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); __utma=57940026.1501977298.1704176442.1704260408.1704264998.7; __utmt=1; __utmb=57940026.7.10.1704264998', 
        'DNT': '1', 
        'Origin': 'https://www.amfiindia.com', 
        'Referer': 'https://www.amfiindia.com/net-asset-value/nav-history', 
        'Sec-Fetch-Dest': 'empty', 
        'Sec-Fetch-Mode': 'cors', 
        'Sec-Fetch-Site': 'same-origin', 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 
        'X-Requested-With': 'XMLHttpRequest', 
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"', 
        'sec-ch-ua-mobile': '?0', 
        'sec-ch-ua-platform': '"Windows"'
    };
    
    //API data request
    const data = `mfID=${mfId}&scID=${scId}&fDate=${fdate}&tDate=${tdate}`;
    
    axios.post(url, data, { headers })
    .then(response => {
        const $ = cheerio.load(response.data);
        const tdValues = [];
    
        //Convert table data into array values
        $('tr').each((index, row) => { 
            const tdArray = [];
            $(row).find('td').each((index, element) => {
                const value = $(element).text();
                if (value.trim() !== '') {
                    tdArray.push(value);
                }
            });
    
            // Check if tdArray has exactly 2 elements
            if (tdArray.length === 2) { 
                tdValues.push(tdArray);
            }
        });
             
        console.log('Table created successfully.');
    
        // Get navdata data
        var selectSql = 'SELECT * FROM navdata';
        con.query(selectSql, function(err, result) {
            if (err) {
                console.error('Error:', err.message);
            } else {
                console.log('Existing values retrieved successfully:');
                console.log(result);
    
                // Check deletion of rows through this
                // var deletesql = 'DELETE FROM navdata WHERE NAV = 108.3033;'
                // con.query(deletesql, function(err, result){
                //     if (err) {
                //         console.error('Error:', err.message);
                //     }else {
                //         console.log('Last value deleted successfully:');
                //         console.log(result);
                //     }
                // });
    
                // If the table is empty, simply append tdValues
                if (result.length === 0) {
                    insertMissingRows(tdValues);
                } else {
                    const existingValues = result.map(row => [row.NAV, row.DATE]);
                    const missingRows = tdValues.filter(row => !existingValues.some(existingRow => existingRow[0] === row[0] && existingRow[1] === row[1]));
                    if (missingRows.length > 0) {
                        insertMissingRows(missingRows);
                    } else {
                        console.log('No missing rows found.');
                    }
                }
            }
        });
        
        //To insert missing values to table
        function insertMissingRows(rows) {
            const insertSql = 'INSERT INTO navdata (NAV, DATE) VALUES ?';
             con.query(insertSql, [rows], function(err, result) {
                if (err) {
                    console.error('Error:', err.message);
                } else {
                    console.log('Missing rows inserted successfully.');
                }
            });
        }
    
    })
    .catch(error => {
        console.error('Error:', error.message);
    });
})




