function buildDisplayObject(item, i) {
  const launchDate = (item.additionalFields.launchDate) ? item.additionalFields.launchDate : "Unknown";
  // Generate a safe ID for the checkbox since product names might have spaces or special characters
  const serviceId = item.additionalFields.productName.replace(/[^a-zA-Z0-9]/g, '');
  return {
    index: i,
    serviceId: serviceId,
    productName: item.additionalFields.productName,
    productSummary: item.additionalFields.productSummary,
    launchDate: item.additionalFields.launchDate,
    productUrl: item.additionalFields.productUrl,
    freeTierAvailability: item.additionalFields.freeTierAvailability,
    productCategory: item.additionalFields.productCategory
  }
}

function buildProductCard(item) {
  const display = buildDisplayObject(item, 0);
  return `
    <article class="card">
      <h4 class="card-title">${display.productName}</h4>
      <div class="card-meta text-accent mb-2">${display.productCategory}</div>
      <p style="font-size: 0.9rem; line-height: 1.4; flex-grow: 1;">${display.productSummary}</p>
      <div style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 1rem;">
        Launched: ${display.launchDate}
      </div>
      <footer style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
        <a href="${display.productUrl}" target="_blank" style="font-family: var(--font-sans); font-weight: 500; font-size: 0.9rem;">View Service &rarr;</a>
      </footer>
    </article>
  `;
}

function setDisplay(id, value) {
  const loading = document.getElementById(id);
  if (loading) {
    loading.style.display = value;
  }
}

function groupByYear(products) {
    const years = new Map();
    products.forEach(item => {
        if (item.additionalFields.launchDate) {
            const year = Number(item.additionalFields.launchDate.substring(0, 4));
            if (years.has(year)) {
                var count = years.get(year);
                var newCount = count + 1;
                years.set(year, newCount);
            } else {
                years.set(year, 1);
            }
        }
    });

    return Array.from(years, ([name, value]) => ({ "year": name, "count": value }));
}

function groupByCategory(products) {
    var categories = new Map();
    products.forEach(item => {
        if (item.additionalFields.productCategory) {
            const category = item.additionalFields.productCategory.trim();
            if (categories.has(category)) {
                var count = categories.get(category);
                var newCount = count + 1;
                categories.set(category, newCount);
            } else {
                categories.set(category, 1);
            }
        }
    });
    categories = new Map([...categories.entries()].sort());
    return Array.from(categories, ([name, value]) => ({ "category": name, "count": value }));
}

function getProductsByCategoryMap(products) {
    const productCategories = new Map();
    products.forEach(item => {
        if (item.additionalFields.productCategory) {
            const category = item.additionalFields.productCategory.trim();
            if (productCategories.has(category)) {
                const productList = productCategories.get(category);
                productList.push(item.additionalFields.productName);
                productCategories.set(category, productList);
            } else {
                const productList = [];
                productList.push(item.additionalFields.productName);
                productCategories.set(category, productList);
            }
        }
    });
    return productCategories;
}

function buildCategoryDisplayObject(key, value, i) {
  const productNames = value.join(', ');
  return {
    index: i,
    productNames: productNames,
    productCategory: key
  }
}

function buildCategoryRow(key, value, i) {
  const display = buildCategoryDisplayObject(key, value, i);
  const indexCell = '<th scope="row">' + display.index + '</th>';
  const productCategory = '<td>' + display.productCategory + '</td>';
  const productNames = '<td>' + display.productNames + '</td>';
  return indexCell + productCategory + productNames;
}

function drawLaunchCountByYear(products) {
  const launchesByYear = groupByYear(results);

  new Chart(
      document.getElementById('launches'),
      {
        type: 'line',
        data: {
          labels: launchesByYear.map(row => row.year),
          datasets: [
            {
              label: 'Launch Count by Year',
              data: launchesByYear.map(row => row.count)
            }
          ]
        }
      }
  );
}

function drawProductCountByCategory(products) {
  const countByCategory = groupByCategory(results);

  var productsInCategory = getProductsByCategoryMap(results);
  productsInCategory = new Map([...productsInCategory.entries()].sort());
  var i = 0;
  productsInCategory.forEach((value, key, map) => {
    i++;
    const tbodyRef = document.getElementById('categoriesTable').getElementsByTagName('tbody')[0];
    const newRow = tbodyRef.insertRow(tbodyRef.rows.length);
    newRow.innerHTML = buildCategoryRow(key, value, i);
  });

  new Chart(
      document.getElementById('productCategories'),
      {
        type: 'polarArea',
        data: {
          labels: countByCategory.map(row => row.category),
          datasets: [
            {
              label: 'Products',
              data: countByCategory.map(row => row.count)
            }
          ]
        }
      }
  );
}

function onload() {
  const results = [];
  fetch('service-list-latest.json')
    .then((response) => response.json())
    .then((data) => {          
      const gridRef = document.getElementById('productsGrid');
      let html = '';
      data.items.forEach(function (entry, index) {
        const item = entry.item;
        if (item && item.additionalFields) {
          results.push(item);            
          html += buildProductCard(item);
        }
      });
      gridRef.innerHTML = html;
      drawLaunchCountByYear(results);
      drawProductCountByCategory(results);
    });
  return results;
}

const results = onload();

var mutated = false;

function filter() {
  const filterExpr = document.getElementById('search').value.trim();
  if (filterExpr && filterExpr.length >= 2 && results) {
    mutated = true;
    const resultContainer = document.getElementById('filtered');
    resultContainer.innerHTML = "";
    setDisplay('filtered', 'none');
    const displayArr = [];
    for (const item of results) {
        const productName = item.additionalFields.productName;
        const productCategory = item.additionalFields.productCategory;
        const launchDate = item.additionalFields.launchDate;
        if (productName && productName.toLowerCase().includes(filterExpr.toLowerCase())
            || (productCategory && productCategory.toLowerCase().includes(filterExpr.toLowerCase()))
            || (launchDate && launchDate.toLowerCase().includes(filterExpr.toLowerCase()))
        ) {
            displayArr.push(item);
        }
    }
    const display = displayArr.reduce((acc, item) => acc + buildProductCard(item), '');
    resultContainer.innerHTML = display;
    setDisplay('filtered', 'grid');
    setDisplay('productsGrid', 'none');
  } else if (mutated === true) {
    const resultContainer = document.getElementById('filtered');
    resultContainer.innerHTML = "";
    setDisplay('filtered', 'none');
    setDisplay('productsGrid', 'grid');
  }
}
