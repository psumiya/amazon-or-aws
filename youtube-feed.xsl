<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:atom="http://www.w3.org/2005/Atom"
                xmlns:yt="http://www.youtube.com/xml/schemas/2015"
                xmlns:media="http://search.yahoo.com/mrss/">

    <xsl:output method="html" indent="yes"/>

    <xsl:template match="/">
        <style>
            .video-description {
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
        </style>
        <xsl:apply-templates select="//atom:entry"/>
    </xsl:template>

    <xsl:template match="atom:entry">
        <xsl:variable name="shareUrl">
            <xsl:text>https://bsky.app/intent/compose?text=</xsl:text>
            <xsl:value-of select="atom:title"/>
            <xsl:text> </xsl:text>
            <xsl:value-of select="atom:link[@rel='alternate']/@href"/>
        </xsl:variable>
        <article>
            <b><xsl:value-of select="atom:title"/></b>
            <xsl:variable name="videoId" select="yt:videoId"/>
            <div>
                <iframe>
                    <xsl:attribute name="src">
                        https://www.youtube.com/embed/<xsl:value-of select="$videoId"/>
                    </xsl:attribute>
                    <xsl:attribute name="allow">
                        accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture
                    </xsl:attribute>
                    <xsl:attribute name="allowfullscreen">true</xsl:attribute>
                </iframe>
            </div>
            <small>
                <xsl:value-of select="media:group/media:community/media:statistics/@views"/> views •
                <xsl:value-of select="substring(atom:published, 1, 10)"/> •
                <a target="_blank" title="Watch on YouTube ">
                    <xsl:attribute name="href">
                        <xsl:value-of select="atom:link[@rel='alternate']/@href"/>
                    </xsl:attribute>
                    <i class="fa-brands fa-youtube" style="color: #f40636;" />
                </a> •
                <a id="feed-bluesky-share-button" rel="nofollow" href="#" target="_blank" title="Share on Bluesky">
                    <xsl:attribute name="href">
                        <xsl:value-of select="$shareUrl"/>
                    </xsl:attribute>
                    <i class="fa-brands fa-bluesky" style="color: #3a88fe;" />
                </a>
                <p class="video-description">
                    <xsl:value-of select="media:group/media:description"/>
                </p>
            </small>
        </article>
    </xsl:template>
</xsl:stylesheet>