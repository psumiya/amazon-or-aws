// Globals
const parser = new window.DOMParser();

function setBlueskyShareUrl(postText, link, hrefId) {
    const elem = document.getElementById(hrefId);
    if (elem) {
        const encodedText = encodeURIComponent(postText);
        const encodedLink = encodeURIComponent(link);
        const blueskyUrl = `https://bsky.app/intent/compose?text=${encodedText}%20${encodedLink}`;
        elem.href = blueskyUrl;
    }
}

setBlueskyShareUrl("View Aggregated Recent Posts about AWS:", window.location.href, "bluesky-share-button");

function setDisplay(id, value) {
  const loading = document.getElementById(id);
  if (loading) {
    loading.style.display = value;
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

const getYoutubeProcessor = async () => {
    const xsl = await getXmlResponse("youtube-feed.xsl");
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
const YOUTUBE_FEED_HTML_ID = "youtube_feed";

const feedSourceMap = new Map();
feedSourceMap.set(AWS_FEED_HTML_ID, "aws-feed-latest.rss");
feedSourceMap.set(LAST_WEEK_IN_AWS_HTML_ID, "last-week-in-aws-latest.rss");
feedSourceMap.set(AWS_ARCHITECTURE_HTML_ID, "aws-architecture-feed-latest.rss");
feedSourceMap.set(AWS_COMMUNITY_HTML_ID, "aws-community-latest.rss");
feedSourceMap.set(AWS_WHATS_NEW_HTML_ID, "aws-whats-new-feed-latest.rss");
feedSourceMap.set(YOUTUBE_FEED_HTML_ID, "aws-youtube-latest.rss");

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
        const [rssProcessor, atomProcessor, youtubeProcessor] = await Promise.all([
            getRssProcessor(),
            getAtomProcessor(),
            getYoutubeProcessor()
        ]);
        // Parallel Fetch All Feeds
        const [awsBlogFeed, lastWeekInAwsFeed, awsArchitectureFeed, awsCommunityFeed, whatsNewFeed, youtubeFeed] = await Promise.all([
            getXmlResponse(feedSourceMap.get(AWS_FEED_HTML_ID)),
            getXmlResponse(feedSourceMap.get(LAST_WEEK_IN_AWS_HTML_ID)),
            getXmlResponse(feedSourceMap.get(AWS_ARCHITECTURE_HTML_ID)),
            getXmlResponse(feedSourceMap.get(AWS_COMMUNITY_HTML_ID)),
            getXmlResponse(feedSourceMap.get(AWS_WHATS_NEW_HTML_ID)),
            getXmlResponse(feedSourceMap.get(YOUTUBE_FEED_HTML_ID))
        ]);
        // Render Feeds
        const feedDestinationSet = new Set([
            new Feed(AWS_FEED_HTML_ID, awsBlogFeed, rssProcessor),
            new Feed(LAST_WEEK_IN_AWS_HTML_ID, lastWeekInAwsFeed, rssProcessor),
            new Feed(AWS_ARCHITECTURE_HTML_ID, awsArchitectureFeed, rssProcessor),
            new Feed(AWS_COMMUNITY_HTML_ID, awsCommunityFeed, atomProcessor),
            new Feed(AWS_WHATS_NEW_HTML_ID, whatsNewFeed, rssProcessor),
            new Feed(YOUTUBE_FEED_HTML_ID, youtubeFeed, youtubeProcessor)
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

            const bskyLink = document.createElement('a');
            bskyLink.href = 'https://bsky.app/intent/compose?text=' + item.title + ' ' + item.link;
            bskyLink.target = '_blank';
            const bskyIcon = document.createElement('i');
            bskyIcon.classList.add('fa-brands');
            bskyIcon.classList.add('fa-bluesky');
            bskyIcon.style.color = '#3a88fe';
            bskyLink.appendChild(bskyIcon);

            // Source in parentheses
            const sourceSpan = document.createElement('span');
            sourceSpan.textContent = ` (${item.source})` + ' • ';
            titleElement.appendChild(sourceSpan);

            titleElement.appendChild(bskyLink);

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