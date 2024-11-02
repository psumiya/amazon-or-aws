<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="html" encoding="UTF-8" indent="yes" />

    <xsl:template match="/">
        <xsl:apply-templates select="//item"/>
    </xsl:template>

    <xsl:template match="item">
        <article id="article">
            <xsl:if test="title">
                <b>
                    <xsl:value-of select="title"/>
                </b>
            </xsl:if>

            <xsl:if test="description">
                <div>
                    <xsl:value-of select="description" disable-output-escaping="yes"/>
                </div>
            </xsl:if>

            <xsl:if test="link">
                <div>
                    <a class="item-link">
                        <xsl:attribute name="href">
                            <xsl:value-of select="link"/>
                        </xsl:attribute>
                        Read more
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