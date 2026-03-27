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

function showTimelineView() {
    // Legacy mapping left for compatibility if needed, but no longer used
}

function showSourceView() {
    // Legacy mapping left for compatibility if needed, but no longer used
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
        // Render Feeds - Only YouTube needs the direct XSLT parsing now
        const youtubeProcessed = youtubeProcessor.transformToFragment(youtubeFeed, document);
        loadFeed(youtubeProcessed, YOUTUBE_FEED_HTML_ID);

        // Extract Blog Items
        const blogItems = [
            ...extractFeedItems(awsBlogFeed, "AWS Blog"),
            ...extractFeedItems(lastWeekInAwsFeed, "Last Week in AWS"),
            ...extractFeedItems(awsArchitectureFeed, "AWS Architecture"),
            ...extractFeedItems(awsCommunityFeed, "AWS Community")
        ];
        
        // Extract Real-Time News (What's New)
        const newsItems = extractFeedItems(whatsNewFeed, "What's New");

        renderEditorialLayout(blogItems, newsItems);
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

const renderEditorialLayout = (blogItems, newsItems) => {
    // 1. Sort all by date
    const uniqueBlogs = Array.from(new Map(blogItems.map(item => [item.link, item])).values());
    uniqueBlogs.sort((a, b) => b.pubDate - a.pubDate);
    
    const uniqueNews = Array.from(new Map(newsItems.map(item => [item.link, item])).values());
    uniqueNews.sort((a, b) => b.pubDate - a.pubDate);

    // 2. Render Featured Story (First Blog Item)
    const featuredItem = uniqueBlogs.length > 0 ? uniqueBlogs[0] : null;
    if (featuredItem) {
        const featuredContainer = document.getElementById('featured_feed');
        featuredContainer.innerHTML = '';
        const article = document.createElement('article');
        article.className = 'featured-story';
        article.innerHTML = `
            <h3><a href="${featuredItem.link}" style="color: white; text-decoration: none;" target="_blank">${featuredItem.title}</a></h3>
            <p style="margin-top: 1rem; margin-bottom: 2rem;">${featuredItem.description ? stripHtml(featuredItem.description).substring(0, 150) + '...' : ''}</p>
            <div class="card-meta">
                <span>By ${featuredItem.source}</span> &bull; <span>${featuredItem.pubDate.toLocaleDateString()}</span>
            </div>
        `;
        featuredContainer.appendChild(article);
    }

    // 3. Render Timeline Grid (Rest of Blogs)
    const timelineContainer = document.getElementById('timelineView');
    timelineContainer.innerHTML = '';
    const timelineItems = uniqueBlogs.slice(1);
    
    // Group timeline items by date
    const groupedItems = timelineItems.reduce((groups, item) => {
        const dateKey = item.pubDate.toISOString().split('T')[0];
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(item);
        return groups;
    }, {});
    
    const sortedDates = Object.keys(groupedItems).sort((a, b) => new Date(b) - new Date(a));
    sortedDates.forEach(date => {
        const dateHeader = document.createElement('h5');
        dateHeader.style.marginTop = '2rem';
        dateHeader.style.marginBottom = '1rem';
        dateHeader.style.borderBottom = '1px solid var(--border-color)';
        dateHeader.style.paddingBottom = '0.5rem';
        dateHeader.textContent = new Date(date).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        timelineContainer.appendChild(dateHeader);

        groupedItems[date].forEach(item => {
            const article = document.createElement('article');
            article.className = 'card mb-2';
            article.innerHTML = `
                <h4 class="card-title"><a href="${item.link}" target="_blank" style="color: var(--text-primary);">${item.title}</a></h4>
                <div class="card-meta">
                    <span class="text-accent font-bold">${item.source}</span>
                    <a href="https://bsky.app/intent/compose?text=${encodeURIComponent(item.title)}%20${encodeURIComponent(item.link)}" target="_blank" title="Share">
                        <i class="fa-brands fa-bluesky" style="color: #3a88fe;"></i>
                    </a>
                </div>
            `;
            timelineContainer.appendChild(article);
        });
    });

    // 4. Render Sidebar "Real-Time Updates" (What's New)
    const sidebarContainer = document.getElementById('sidebar_feed');
    sidebarContainer.innerHTML = '';
    const topNews = uniqueNews.slice(0, 15);
    topNews.forEach(item => {
        const div = document.createElement('div');
        div.className = 'sidebar-item';
        div.innerHTML = `
            <div class="sidebar-item-title"><a href="${item.link}" target="_blank" style="color: var(--text-primary);">${item.title}</a></div>
            <div class="sidebar-item-meta">${item.pubDate.toLocaleDateString()}</div>
        `;
        sidebarContainer.appendChild(div);
    });
}

function stripHtml(html) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

loadAllFeeds();