export DISTRIBUTION_ID=E213MUDPWD4BHU

echo ""
echo "Creating Cache Invalidation for CloudFront Distribution $DISTRIBUTION_ID"
echo ""
echo "aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths '/amazon-or-aws.*'"
echo ""

aws cloudfront create-invalidation \
--distribution-id $DISTRIBUTION_ID \
--paths '/amazon-or-aws.*'

echo ""
echo "To view status of invalidation, export id from response above as INVALIDATION_ID."
echo ""
echo "For example: export INVALIDATION_ID=I6OGGTXC3RBWFN1DZNXQQH8F6Y"
echo ""
echo "Then run the following command:"
echo ""
echo "aws cloudfront get-invalidation --id $INVALIDATION_ID --distribution-id $DISTRIBUTION_ID"
echo ""