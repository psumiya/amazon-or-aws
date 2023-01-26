export S3_BUCKET=amazonoraws.com

aws s3 sync . s3://$S3_BUCKET --dryrun \
--exclude '*' \
--include 'amazon-or-aws.html' \
--include 'service-list.json' \
--include 'amazon-or-aws.js' \
--include 'amazon-or-aws.css'

read -p "Continue with deployment? " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo "Uploading files to S3"

  aws s3 sync . s3://$S3_BUCKET \
  --exclude '*' \
  --include 'amazon-or-aws.html' \
  --include 'service-list.json' \
  --include 'amazon-or-aws.js' \
  --include 'amazon-or-aws.css'
fi