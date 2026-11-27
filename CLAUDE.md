# Amazon or AWS

Static site at amazonoraws.com: a News page (AWS blogs, Last Week in AWS, What's New launches, AWS YouTube) and a Services page (every AWS service, Amazon vs AWS prefix). See README.adoc for layout and commands.

## Current state

- Built like psumiya/todayinai without the LLM step: `.github/workflows/daily.yml` fetches sources, commits `data/`, builds `dist/` with Jinja, deploys to GitHub Pages. Custom domain amazonoraws.com is set in Settings → Pages (a CNAME file is ignored for Actions deploys); DNS is the Route 53 zone Z00881711JTLZUWISMJCF, apex A records to GitHub Pages IPs, www CNAME to psumiya.github.io.
- community.aws moved to builder.aws.com and has no feed, so it was dropped as a source.
- The AWS products API returns launch dates only through 2024.

## Rules

- Ask before any push, deploy, DNS change, or AWS resource change.
- Don't change the workflow schedule without asking.
