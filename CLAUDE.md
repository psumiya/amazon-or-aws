# Amazon or AWS

Static site at amazonoraws.com: a News page (AWS blogs, Last Week in AWS, What's New launches, AWS YouTube) and a Services page (every AWS service, Amazon vs AWS prefix). See README.adoc for layout and commands.

## Current state

- Built like psumiya/todayinai without the LLM step: `.github/workflows/daily.yml` fetches sources, commits `data/`, builds `dist/` with Jinja, deploys to GitHub Pages. `CNAME` points the Pages site at amazonoraws.com.
- Old hosting: S3 bucket `amazonoraws.com` behind CloudFront, fed by 7 Java Lambdas on EventBridge schedules in us-west-2 (rules disabled 2026-10-15). To be retired once DNS points at GitHub Pages.
- community.aws moved to builder.aws.com and has no feed, so it was dropped as a source.
- The AWS products API returns launch dates only through 2024.

## Rules

- Ask before any push, deploy, DNS change, or AWS resource change.
- Don't change the workflow schedule without asking.
