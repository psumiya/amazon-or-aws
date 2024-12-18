<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:atom="http://www.w3.org/2005/Atom">

    <xsl:output method="html" indent="yes" encoding="UTF-8"/>

    <xsl:template match="/">
        <xsl:apply-templates select="/atom:feed/atom:entry"/>
    </xsl:template>

    <xsl:template match="atom:entry">
        <article id="article">
            <b><xsl:value-of select="atom:title"/></b>
            <div>
                <xsl:value-of select="atom:summary"/>
            </div>
            <div>
                <a>
                    <xsl:attribute name="href">
                        <xsl:value-of select="atom:link/@href"/>
                    </xsl:attribute>
                    Read more
                </a>
            </div>
            <footer>
                <small>
                    Published: <xsl:value-of select="substring(atom:updated, 1, 10)"/>
                </small>
            </footer>
        </article>
    </xsl:template>

</xsl:stylesheet>