
const apiKey = "a05514ed595a4a6e8b6558d64a5fcf57";


  const url = new URL("https://api.spoonacular.com/recipes/findByIngredients");
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("ingredients", ingredients.join(",")); // Join ingredients for comma separation
  url.searchParams.set("number", 5); // Adjust number of results as needed

  fetch(url)
    .then(response => response.json())
    .then(data => {
      console.log(data);
      let content=document.getElementById('output');
      let html=``;
      if(Array.isArray(data)){
        for(let i=0;i<data.length;i++){
          html+=`<h6>${data[i].title}</h6><br>`;
          html+=`<img src="${data[i].image}" alt='ricepe_image'`;
          html+='<br><p>Ingredients used:<br><ol>';
          for(let j=0;j<(data[i].missedIngredients).length;j++){
            html+=`<li>Name:${(data[i].missedIngredients)[j].name},Quantity:${(data[i].missedIngredients)[j].amount}${(data[i].missedIngredients)[j].unit}</li>`;
          }
          for(let k=0;k<(data[i].usedIngredients).length;k++){
            html+=`<li>Name:${(data[i].usedIngredients)[k].name},Quantity:${(data[i].usedIngredients)[k].amount} ${(data[i].usedIngredients)[k].unit}</li>`;
          }
          html+=`</ol></p>`
        }
      }
      content.innerHTML=html;
      console.log(html);
    })
    .catch(error => console.error("Error:", error));

const ingredients=localStorage.getItem('ingredients');
console.log(ingredients);  

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
  // Map file extensions to their respective Content-Type headers
  const contentTypeMap = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript'
  };

  // Determine the file path based on the requested URL
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  
  // Get the file extension
  const extname = path.extname(filePath);

  // Check if the requested file exists
  fs.exists(filePath, (exists) => {
    if (!exists) {
      // If the file does not exist, respond with a 404 status code
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    // Read the file and serve its content
    fs.readFile(filePath, (err, data) => {
      if (err) {
        // If there's an error reading the file, respond with a 500 status code
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
        return;
      }

      // Set the appropriate Content-Type header based on the file extension
      const contentType = contentTypeMap[extname] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      
      // Send the file content as the response body
      res.end(data);
    });
  });
});

// Start the server and listen on port 3000
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
