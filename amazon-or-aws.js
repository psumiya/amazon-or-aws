function buildRow(item, i) {
  const indexCell = '<th scope="row">' + i + '</th>';
  const name = '<td>' + item.additionalFields.productName + '</td>';
  const desc = '<td>' + item.additionalFields.productSummary + '</td>';
  const launchDate = '<td>' + item.additionalFields.launchDate + '</td>';
  const link = '<td><a href="' + item.additionalFields.productUrl + '">View</a></td>';
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
  const name = item.additionalFields.productName;
  const desc = item.additionalFields.productSummary;
  const launchDate = item.additionalFields.launchDate;
  const link = '<a href="' + item.additionalFields.productUrl + '">View</a>';
  return '<article><h3>' + name + '</h3>' + '<p>' + desc + '</p>' 
    + '<footer><small>' 
    + 'Category: ' + item.additionalFields.productCategory 
    + ' | Launch Date: ' + launchDate 
    + ' | View Details: ' + link 
    + '</small></footer></article>';
}

function setDisplay(id, value) {
  const loading = document.getElementById(id);
  if (loading) {
      loading.style.display = value;
  }
}

function filter() {
  const filterExpr = document.getElementById('search').value.trim();
  if (filterExpr && filterExpr.length >= 3 && results) {
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