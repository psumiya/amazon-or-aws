function buildDisplayObject(item, i) {
  return {
    index: i,
    productName: item.additionalFields.productName,
    productSummary: item.additionalFields.productSummary,
    launchDate: item.additionalFields.launchDate,
    productUrl: item.additionalFields.productUrl,
    freeTierAvailability: item.additionalFields.freeTierAvailability,
    productCategory: item.additionalFields.productCategory
  }
}

function buildRow(item, i) {
  const display = buildDisplayObject(item, i);
  const indexCell = '<th scope="row">' + display.index + '</th>';
  const name = '<td>' + display.productName + '</td>';
  const desc = '<td>' + display.productSummary + '</td>';
  const launchDate = '<td>' + display.launchDate + '</td>';
  const link = '<td><a href="' + display.productUrl + '">View</a></td>';
  return indexCell + name + desc + launchDate + link;
}

function onload() {
  const results = [];
    fetch('service-list.json')
      .then((response) => response.json())
      .then((data) => {          
        const tbodyRef = document.getElementById('resultTable').getElementsByTagName('tbody')[0];
        data.items.forEach(function (entry, index) {
          const item = entry.item;
          if (item && item.additionalFields) {
            results.push(item);            
            const newRow = tbodyRef.insertRow(tbodyRef.rows.length);
            newRow.innerHTML = buildRow(item, index + 1);
          }
        });      
      });
      return results;
  }

const results = onload();

function buildCard(item) {
  const display = buildDisplayObject(item, 0);
  const link = '<a href="' + display.productUrl + '">View Details</a>';
  const freeTier = '<p>' + display.freeTierAvailability + '</p>';
  return '<article><h3>' + display.productName + '</h3>' 
    + '<p>' + display.productSummary + '</p>' 
    + '<p>Category: ' + display.productCategory + '</p>' 
    + '<p>Launch Date: ' + display.launchDate + '</p>' 
    + '<footer><small>' + freeTier + link + '</small></footer></article>';
}

function setDisplay(id, value) {
  const loading = document.getElementById(id);
  if (loading) {
    loading.style.display = value;
  }
}

function filter() {
  const filterExpr = document.getElementById('search').value.trim();
  if (filterExpr && filterExpr.length >= 2 && results) {
    const resultContainer = document.getElementById('filtered');
    resultContainer.innerHTML = "";
    setDisplay('filtered', 'none');
    var display = "";
    results.forEach(function (item, index) {
      if (item.additionalFields.productName.includes(filterExpr)) {
        display = display + buildCard(item);
      }      
    });
    resultContainer.innerHTML = display;
    setDisplay('filtered', 'block');
  }
}