const axios = require('axios');
let data = 'mfID=3&scID=148921&fDate=01-Dec-2023&tDate=03-Jan-2024';

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'https://www.amfiindia.com/modules/NavHistoryPeriod',
  headers: { 
    'Accept': '*/*', 
    'Accept-Language': 'en-US,en;q=0.9', 
    'Connection': 'keep-alive', 
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 
    'Cookie': '_fbp=fb.1.1704176441753.376228623; __utmc=57940026; __utmz=57940026.1704176442.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); __utma=57940026.1501977298.1704176442.1704271578.1704276035.9', 
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
  },
  data : data
};

axios.request(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});
