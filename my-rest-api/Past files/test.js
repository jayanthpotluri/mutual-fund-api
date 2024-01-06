const puppeteer = require('puppeteer');
const isin = 'INF209KA12Z1'; //Input
let schemeId = '';
let schemeName = '';
let mutualFundId = '';
let mutualFundName = '';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // await page.setViewport({ width: 1258, height: 1096 });

  await page.goto('https://www.amfiindia.com/nav-history-download');

  const hrefText = await page.evaluate(() => {
    const anchors = document.querySelectorAll('a');
    for (const anchor of anchors) {
      if (anchor.textContent === 'Download Complete NAV Report in Text Format') { 
        return anchor.href; //return the link assigned to the anchor tag
      }
    }
  });

  await page.goto(hrefText); //redirect to the page


  const pageContent = await page.content();   // Get the contents of the page as a string
  if (pageContent.includes(isin)) { 
    // console.log('isin number is present in pageContent');
    const lines = pageContent.split('\n').filter(line => line.trim() !== '' && line.includes(';'));
    lines.splice(0, 1);
    const twoDimensionalArray = lines.map(line => line.replace('&amp;', '&').split(';').filter(value => value.trim() !== ''));

    const position = twoDimensionalArray.findIndex(arr => arr.includes(isin));
    schemeId = twoDimensionalArray[position][0];
    schemeName = twoDimensionalArray[position][3];

    await page.goto('https://www.amfiindia.com/net-asset-value/nav-history');

    const optionValues = await page.evaluate(() => {
      const dropdown = document.querySelector('#NavHisMFName');
      
      // Extract the option values from the dropdown
      const options = Array.from(dropdown.options).map(option => {
          return {
            value: option.value,
            text: option.text
          };
        });
        
        return options;
    });
  
    // Print the extracted option values
    // console.log('Dropdown Option Values:', optionValues);

    const similarityPercentage = (str1, str2) => {
      const len1 = str1.length;
      const len2 = str2.length;
      const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));
    
      for (let i = 0; i <= len1; i++) {
        matrix[i][0] = i;
      }
    
      for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
      }
    
      for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
          const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1, // deletion
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j - 1] + cost // substitution
          );
        }
      }
    
      const distance = matrix[len1][len2];
      const maxLength = Math.max(len1, len2);
      const percentage = ((maxLength - distance) / maxLength) * 100;
    
      return percentage.toFixed(2);
    };
    
    const maxSimilarity = optionValues.reduce((max, option) => {
      const percentage = similarityPercentage(schemeName.toLowerCase(), option.text.toLowerCase());
      return percentage > max.percentage ? { percentage, option } : max;
    }, { percentage: 0, option: null });

    mutualFundId = maxSimilarity.option.value;
    mutualFundName = maxSimilarity.option.text;
    
    console.log("isin:" + isin);
    console.log('MutualFund ID:' + mutualFundId);
    console.log('MutualFund Name:' + mutualFundName);
    console.log("Scheme Id:" + schemeId);
    console.log("Scheme Name:" + schemeName);

    // Export the values
    

  } else {
    console.log('isin number is not present in pageContent');
  }

  await browser.close();
})();