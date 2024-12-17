// Globals
const parser = new window.DOMParser();

function buildDisplayObject(item, i) {
  const launchDate = (item.additionalFields.launchDate) ? item.additionalFields.launchDate : "Unknown";
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

function buildCard(item) {
  const display = buildDisplayObject(item, 0);
  const link = '<a href="' + display.productUrl + '">View Details</a>';
  return '<article><h3>' + display.productName + '</h3>' 
    + '<p>' + display.productSummary + '</p>' 
    + '<p>Category: ' + display.productCategory + '</p>' 
    + '<p>Launch Date: ' + display.launchDate + '</p>' 
    + '<footer><small>' + link + '</small></footer></article>';
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
      const tbodyRef = document.getElementById('resultTable').getElementsByTagName('tbody')[0];
      data.items.forEach(function (entry, index) {
        const item = entry.item;
        if (item && item.additionalFields) {
          results.push(item);            
          const newRow = tbodyRef.insertRow(tbodyRef.rows.length);
          newRow.innerHTML = buildRow(item, index + 1);
        }
      });
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
    const display = displayArr.reduce((acc, item) => acc + buildCard(item), '');
    resultContainer.innerHTML = display;
    setDisplay('filtered', 'block');
  } else if (mutated === true) {
    const resultContainer = document.getElementById('filtered');
    resultContainer.innerHTML = "";
    setDisplay('filtered', 'none');
  }
}

function toggleCss() {
    document.getElementById("feed-view-by-timeline").classList.remove("contrast");
    document.getElementById("feed-view-by-source").classList.remove("contrast");
}

function showTimelineView() {
    setDisplay('timelineView', 'block');
    setDisplay('sourceView', 'none');
    toggleCss();
    document.getElementById("feed-view-by-timeline").classList.add("contrast");
}

function showSourceView() {
    setDisplay('timelineView', 'none');
    setDisplay('sourceView', 'block');
    toggleCss();
    document.getElementById("feed-view-by-source").classList.add("contrast");
}

const fetchTextResponse = (response) => {
    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    return response.text();
}

const getXmlResponse = async (url) => {
    const response = await fetchTextResponse(await fetch(url));
    return parser.parseFromString(response, "text/xml");
}

const getRssProcessor = async () => {
    const xsl = await getXmlResponse("rss-feed.xsl");
    const xsltProcessor = new XSLTProcessor();
    xsltProcessor.importStylesheet(xsl);
    return xsltProcessor;
}

const getAtomProcessor = async () => {
    const xsl = await getXmlResponse("atom-feed.xsl");
    const xsltProcessor = new XSLTProcessor();
    xsltProcessor.importStylesheet(xsl);
    return xsltProcessor;
}

const loadFeed = async (resultDocument, htmlId) => {
    if (resultDocument) {
        const container = document.getElementById(htmlId);
        if (container) {
            container.appendChild(resultDocument);
        } else {
            console.error(`Container element with id "${htmlId}" not found`);
        }
    } else {
        console.error('XSLT transformation failed to produce a result.');
    }
}

const AWS_FEED_HTML_ID = "aws_feed";
const LAST_WEEK_IN_AWS_HTML_ID = "last_week_in_aws_feed";
const AWS_ARCHITECTURE_HTML_ID = "aws_architecture_feed";
const AWS_COMMUNITY_HTML_ID = "aws_community_feed";
const AWS_WHATS_NEW_HTML_ID = "aws_whats_new";

const feedSourceMap = new Map();
feedSourceMap.set(AWS_FEED_HTML_ID, "aws-feed-latest.rss");
feedSourceMap.set(LAST_WEEK_IN_AWS_HTML_ID, "last-week-in-aws-latest.rss");
feedSourceMap.set(AWS_ARCHITECTURE_HTML_ID, "aws-architecture-feed-latest.rss");
feedSourceMap.set(AWS_COMMUNITY_HTML_ID, "aws-community-latest.rss");
feedSourceMap.set(AWS_WHATS_NEW_HTML_ID, "aws-whats-new-feed-latest.rss");

class Feed {
  constructor(htmlId, content, processor) {
    this.htmlId = htmlId;
    this.content = content;
    this.processor = processor;
  }
}

async function loadAllFeeds() {
    try {
        // Parallel Fetch All Processors
        const [rssProcessor, atomProcessor] = await Promise.all([
            getRssProcessor(),
            getAtomProcessor()
        ]);
        // Parallel Fetch All Feeds
        const [awsBlogFeed, lastWeekInAwsFeed, awsArchitectureFeed, awsCommunityFeed, whatsNewFeed] = await Promise.all([
            getXmlResponse(feedSourceMap.get(AWS_FEED_HTML_ID)),
            getXmlResponse(feedSourceMap.get(LAST_WEEK_IN_AWS_HTML_ID)),
            getXmlResponse(feedSourceMap.get(AWS_ARCHITECTURE_HTML_ID)),
            getXmlResponse(feedSourceMap.get(AWS_COMMUNITY_HTML_ID)),
            getXmlResponse(feedSourceMap.get(AWS_WHATS_NEW_HTML_ID))
        ]);
        // Render Feeds
        const feedDestinationSet = new Set([
            new Feed(AWS_FEED_HTML_ID, awsBlogFeed, rssProcessor),
            new Feed(LAST_WEEK_IN_AWS_HTML_ID, lastWeekInAwsFeed, rssProcessor),
            new Feed(AWS_ARCHITECTURE_HTML_ID, awsArchitectureFeed, rssProcessor),
            new Feed(AWS_COMMUNITY_HTML_ID, awsCommunityFeed, atomProcessor),
            new Feed(AWS_WHATS_NEW_HTML_ID, whatsNewFeed, rssProcessor)
        ]);
        for (const feed of feedDestinationSet) {
            loadFeed(feed.processor.transformToFragment(feed.content, document), feed.htmlId);
        }

        const allItems = [
            ...extractFeedItems(awsBlogFeed, "AWS Blog"),
            ...extractFeedItems(lastWeekInAwsFeed, "Last Week in AWS"),
            ...extractFeedItems(awsArchitectureFeed, "AWS Architecture"),
            ...extractFeedItems(awsCommunityFeed, "AWS Community"),
            ...extractFeedItems(whatsNewFeed, "What's New with AWS?")
        ];
        const groupedItems = groupAndSortItems(allItems);
        renderGroupedFeeds(groupedItems);
    } catch (error) {
        console.error('Error processing RSS feed:', error);
    }
}

const parseDate = (dateString) => {
    const parsedDate = new Date(dateString);
    return isNaN(parsedDate.getTime()) ? '' : parsedDate;
}

const getArticle = (item, sourceName) => {
    const getElementText = (tagName) => {
        const element = item.getElementsByTagName(tagName)[0];
        return element ? element.textContent.trim() : '';
    }
    const getLinkHref = () => {
        const linkElement = item.getElementsByTagName('link')[0];
        if (linkElement) {
            // For Atom feeds, try to get the href attribute
            return linkElement.getAttribute('href') || '';
        }
        return '';
    }
    const getUpdatedDate = () => {
        const updatedElement = item.getElementsByTagName('updated')[0];
        return updatedElement ? updatedElement.textContent.trim() : '';
    }
    const article = {
        title: getElementText('title'),
        description: getElementText('description') || getElementText('summary'),
        link: getElementText('link') || getLinkHref(),
        pubDate: parseDate(getElementText('pubDate')) || parseDate(getUpdatedDate()),
        source: sourceName
    };
    return article;
}

const extractFeedItems = (xmlDoc, sourceName) => {
    const articles = [];
    const itemElements = xmlDoc.getElementsByTagName('item');
    const entryElements = xmlDoc.getElementsByTagName('entry');
    Array.from(itemElements).forEach(item => {
        const article = getArticle(item, sourceName);
        if (Object.values(article).some(value => value !== '')) {
            articles.push(article);
        }
    });
    Array.from(entryElements).forEach(item => {
        const article = getArticle(item, sourceName);
        if (Object.values(article).some(value => value !== '')) {
            articles.push(article);
        }
    });
    return articles;
}

const groupAndSortItems = (items) => {
    // Deduplicate items based on link
    const uniqueItems = Array.from(
        new Map(items.map(item => [item.link, item])).values()
    );

    // Sort items by date (newest first)
    uniqueItems.sort((a, b) => b.pubDate - a.pubDate);

    // Group items by date
    const groupedItems = uniqueItems.reduce((groups, item) => {
        const dateKey = item.pubDate.toISOString().split('T')[0];
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(item);
        return groups;
    }, {});

    return groupedItems;
}

const renderGroupedFeeds = (groupedItems) => {
    const container = document.getElementById('timelineView');
    container.innerHTML = ''; // Clear existing content

    // Sort dates in descending order
    const sortedDates = Object.keys(groupedItems).sort((a, b) => new Date(b) - new Date(a));

    sortedDates.forEach(date => {
        // Create date article
        const dateArticle = document.createElement('article');

        // Create date header
        const dateHeader = document.createElement('h4');
        dateHeader.textContent = new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        dateArticle.appendChild(dateHeader);

        // Create details element
        const details = document.createElement('details');
        details.open = true;

        // Create summary
        const summary = document.createElement('summary');
        summary.textContent = 'Click to Expand/Collapse';
        details.appendChild(summary);

        // Create section for items
        const section = document.createElement('section');

        // Add items to section
        groupedItems[date].forEach(item => {
            const itemArticle = document.createElement('article');

            const titleElement = document.createElement('h4');
            const titleLink = document.createElement('a');
            titleLink.href = item.link;
            titleLink.target = '_blank';
            titleLink.textContent = item.title;
            titleElement.appendChild(titleLink);

            // Source in parentheses
            const sourceSpan = document.createElement('span');
            sourceSpan.textContent = ` (${item.source})`;
            titleElement.appendChild(sourceSpan);

            itemArticle.appendChild(titleElement);

            // Description
            if (item.description) {
                const descriptionDiv = document.createElement('div');
                descriptionDiv.innerHTML = item.description;
                const tables = descriptionDiv.getElementsByTagName('table');
                while (tables[0]) {
                    tables[0].parentNode.removeChild(tables[0]);
                }
                itemArticle.appendChild(descriptionDiv);
            }

            section.appendChild(itemArticle);
        });

        details.appendChild(section);
        dateArticle.appendChild(details);
        container.appendChild(dateArticle);
    });
}

loadAllFeeds();