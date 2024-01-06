// Import required modules
const express = require('express');
const mysql = require('mysql');
const axios = require('axios');
const cheerio = require('cheerio');

// Create an instance of the Express application
const app = express();

const fdate = '07-Dec-2023';
const tdate = '03-Jan-2024';

// Define the database connection details
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'mutualfund'
});

// Connect to the database
db.connect(err => {
  if (err) {
    console.error('MySQL connection error:', err);
    process.exit(1); // Exit the application if there is a connection error
  }
  console.log('Connected to MySQL database');
});

// Create the table if it doesn't exist
const createTableSql = 'CREATE TABLE IF NOT EXISTS navdata (NAV VARCHAR(255), DATE VARCHAR(255))';
db.query(createTableSql, function(err, result) {
  if (err) {
    console.error('Error:', err.message);
    process.exit(1); // Exit the application if there is an error creating the table
  }
  console.log('Table created successfully.');
});

// Define the route handler
app.get('/:mfId/:scId', async (req, res) => {
  try {
    const mfId = req.params.mfId;
    const scId = req.params.scId;

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

    const data = `mfID=${mfId}&scID=${scId}&fDate=${fdate}&tDate=${tdate}`;

    const response = await axios.post(url, data, { headers });
    const $ = cheerio.load(response.data);
    const tdValues = [];

    $('tr').each((index, row) => {
      const tdArray = [];
      $(row)
        .find('td')
        .each((index, element) => {
          const value = $(element).text();
          if (value.trim() !== '') {
            tdArray.push(value);
          }
        });

      if (tdArray.length === 2) {
        tdValues.push(tdArray);
      }
    });

    await insertMissingRows(tdValues);

    const selectSql = 'SELECT * FROM navdata';
    db.query(selectSql, function (err, result) {
      if (err) {
        console.error('MySQL query error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        console.log('Existing values retrieved successfully:');
        console.log(result);
        res.json(result);
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Function to insert missing rows into the database
async function insertMissingRows(rows) {
  try {
    const deleteSql = 'DELETE FROM navdata';
    await new Promise((resolve, reject) => {
      db.query(deleteSql, function (err, result) {
        if (err) {
          console.error('Error:', err.message);
          reject(err);
        } else {
          console.log('All rows deleted successfully.');
          resolve();
        }
      });
    });

    const insertSql = 'INSERT INTO navdata (NAV, DATE) VALUES ?';
    const formattedRows = rows.map((row) => [parseFloat(row[0]), row[1]]);
    await new Promise((resolve, reject) => {
      db.query(insertSql, [formattedRows], function (err, result) {
        if (err) {
          console.error('Error:', err.message);
          reject(err);
        } else {
          console.log('Missing rows inserted successfully.');
          resolve();
        }
      });
    });
  } catch (error) {
    throw error;
  }
}

// Start the server
const server = app.listen(3000, () => {
  console.log('Server started on port 3000');
});