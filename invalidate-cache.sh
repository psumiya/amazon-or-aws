export DISTRIBUTION_ID=E213MUDPWD4BHU

echo ""
echo "Creating Cache Invalidation for CloudFront Distribution $DISTRIBUTION_ID"
echo ""
echo "aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths '/amazon-or-aws.*'"
echo ""

aws cloudfront create-invalidation \
--distribution-id $DISTRIBUTION_ID \
--paths '/amazon-or-aws.*' '/service-list.json'

echo ""
echo "To view status of invalidation, use id from response above and replace at <ID>, then run below command."
echo ""
echo "aws cloudfront get-invalidation  --distribution-id $DISTRIBUTION_ID --id <ID>"
echo ""