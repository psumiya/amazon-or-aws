<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:atom="http://www.w3.org/2005/Atom"
                xmlns:yt="http://www.youtube.com/xml/schemas/2015"
                xmlns:media="http://search.yahoo.com/mrss/">

    <xsl:output method="html" indent="yes"/>

    <xsl:template match="/">
        <style>
            .video-list {
                margin: 0 auto;
            }

            .video-item {
                margin-bottom: 5px;
                padding: 15px;
                display: grid;
                grid-template-columns: 200px 1fr;
                gap: 15px;
            }

            .video-thumbnail {
                width: 200px;
                height: 112px;
                object-fit: cover;
                border-radius: 4px;
            }

            .video-content {
                display: flex;
                flex-direction: column;
            }

            .video-title {
                font-size: 18px;
                margin: 0 0 10px 0;
                color: #1a1a1a;
            }

            .video-metadata {
                font-size: 14px;
                color: #666;
                margin-bottom: 10px;
            }

            .video-description {
                color: #666;
                margin-bottom: 15px;
                font-size: 14px;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .video-embed {
                grid-column: 1 / -1;
                margin-top: 15px;
                display: none;
            }

            .video-embed.active {
                display: block;
            }

            .video-embed iframe {
                width: 100%;
                aspect-ratio: 16/9;
                border: none;
            }

            @media (max-width: 600px) {
                .video-item {
                    grid-template-columns: 1fr;
                }

                .video-thumbnail {
                    width: auto;
                    height: auto;
                }
            }
        </style>

        <div id="video-list" class="video-list">
            <xsl:apply-templates select="//atom:entry"/>
        </div>
    </xsl:template>

    <xsl:template match="atom:entry">
        <div class="video-item">
            <xsl:variable name="videoId" select="yt:videoId"/>

            <div>
                <iframe class="video-thumbnail">
                    <xsl:attribute name="src">
                        https://www.youtube.com/embed/<xsl:value-of select="$videoId"/>
                    </xsl:attribute>
                    <xsl:attribute name="allow">
                        accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture
                    </xsl:attribute>
                    <xsl:attribute name="allowfullscreen">true</xsl:attribute>
                </iframe>
            </div>
            <div class="video-content">
                <h5>
                    <xsl:value-of select="atom:title"/>
                </h5>

                <div class="video-metadata">
                    <xsl:value-of select="media:group/media:community/media:statistics/@views"/> views •
                    <xsl:value-of select="substring(atom:published, 1, 10)"/> •
                    <a target="_blank">
                        <xsl:attribute name="href">
                            <xsl:value-of select="atom:link[@rel='alternate']/@href"/>
                        </xsl:attribute>
                        Watch on YouTube
                    </a>
                </div>

                <p class="video-description">
                    <xsl:value-of select="media:group/media:description"/>
                </p>

            </div>
        </div>
    </xsl:template>
</xsl:stylesheet>