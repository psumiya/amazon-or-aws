function rssToHtml(RSS_URL, RSS_XSLT, htmlId) {
    fetch(RSS_URL)
      .then(response => response.text())
      .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
      .then(rssXml => {
        const xsltProcessor = new XSLTProcessor();
        fetch(RSS_XSLT)
          .then(response => response.text())
          .then(xslt => {
            const xsl = new window.DOMParser().parseFromString(xslt, "text/xml");
            xsltProcessor.importStylesheet(xsl);
            const resultDocument = xsltProcessor.transformToFragment(rssXml, document);
            if (resultDocument) {
                document.getElementById(htmlId).appendChild(resultDocument);
            }
          });
      })
}

rssToHtml(`aws-feed-latest.rss`, `aws-feed.xsl`, "aws_feed");
rssToHtml(`last-week-in-aws-latest.rss`, `aws-feed.xsl`, "last_week_in_aws_feed");
rssToHtml(`aws-architecture-feed-latest.rss`, `aws-feed.xsl`, "aws_architecture_feed");
