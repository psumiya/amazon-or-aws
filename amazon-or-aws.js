function onload() {
    fetch('service-list.json')
      .then((response) => response.json())
      .then((data) => {          
        var tbodyRef = document.getElementById('resultTable').getElementsByTagName('tbody')[0];
        data.items.forEach(function (item, index) {
          if (item && item.additionalFields && item.additionalFields.category && item.additionalFields.category == "products") {              
            const indexCell = '<th scope="row">' + (index + 1) + '</th>';
            const name = '<td>' + item.additionalFields.title + '</td>';
            const desc = '<td>' + item.additionalFields.desc + '</td>';
            const launchDate = '<td>' + item.dateCreated + '</td>';
            const link = '<td><a href="' + item.additionalFields.primaryUrl + '">View</a></td>';
            const contentHtml = indexCell + name + desc + launchDate + link;
            const newRow = tbodyRef.insertRow(tbodyRef.rows.length);
            newRow.innerHTML = contentHtml;
          }
        });      
      });
  }

onload();