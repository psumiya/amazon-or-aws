function onload() {
    var results = [];
    fetch('service-list.json')
      .then((response) => response.json())
      .then((data) => {          
        var tbodyRef = document.getElementById('resultTable').getElementsByTagName('tbody')[0];
        var i = 0;
        data.items.forEach(function (entry, index) {
          const item = entry.item;
          if (item && item.additionalFields) {
            i = i + 1;
            results.push(item);
            const indexCell = '<th scope="row">' + i + '</th>';
            const name = '<td>' + item.additionalFields.productName + '</td>';
            const desc = '<td>' + item.additionalFields.productSummary + '</td>';
            const launchDate = '<td>' + item.additionalFields.launchDate + '</td>';
            const link = '<td><a href="' + item.additionalFields.productUrl + '">View</a></td>';
            const contentHtml = indexCell + name + desc + launchDate + link;
            const newRow = tbodyRef.insertRow(tbodyRef.rows.length);
            newRow.innerHTML = contentHtml;
          }
        });      
      });
      return results;
  }

const results = onload();