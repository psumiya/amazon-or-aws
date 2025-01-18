<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="html" encoding="UTF-8" indent="yes" />

    <xsl:template match="/">
        <xsl:apply-templates select="//item"/>
    </xsl:template>

    <xsl:template match="item">
        <xsl:variable name="shareUrl">
            <xsl:text>https://bsky.app/intent/compose?text=</xsl:text>
            <xsl:value-of select="title"/>
            <xsl:text> </xsl:text>
            <xsl:value-of select="link"/>
        </xsl:variable>
        <article id="article">
            <xsl:if test="title">
                <b>
                    <xsl:value-of select="title"/>
                </b>
            </xsl:if>

            <xsl:if test="description">
                <div>
                    <xsl:choose>
                        <!-- If description contains HTML-escaped content -->
                        <xsl:when test="contains(description, '&lt;table')">
                            <xsl:variable name="before-table" select="substring-before(description, '&lt;table')" />
                            <xsl:variable name="after-table" select="substring-after(description, '&lt;/table&gt;')" />
                            <xsl:value-of select="$before-table" disable-output-escaping="yes"/>
                            <xsl:value-of select="$after-table" disable-output-escaping="yes"/>
                        </xsl:when>
                        <!-- If no table is found, output the entire description -->
                        <xsl:otherwise>
                            <xsl:value-of select="description" disable-output-escaping="yes"/>
                        </xsl:otherwise>
                    </xsl:choose>
                </div>
            </xsl:if>

            <xsl:if test="link">
                <div>
                    <a>
                        <xsl:attribute name="href">
                            <xsl:value-of select="link"/>
                        </xsl:attribute>
                        Read more
                    </a> •
                    <a id="text-feed-bluesky-share-button" rel="nofollow" href="#" target="_blank" title="Share on Bluesky">
                        <xsl:attribute name="href">
                            <xsl:value-of select="$shareUrl"/>
                        </xsl:attribute>
                        <i class="fa-brands fa-bluesky" style="color: #3a88fe;" />
                    </a>
                </div>
            </xsl:if>

            <xsl:if test="pubDate">
                <footer>
                    <small>
                        Published: <xsl:value-of select="pubDate"/>
                    </small>
                </footer>
            </xsl:if>
        </article>
    </xsl:template>
</xsl:stylesheet>