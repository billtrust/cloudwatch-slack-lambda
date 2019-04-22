sls invoke local -p test/sns-autoscaling-event.json\
    -f cloudwatch-to-slack \
    -e AWS_ENV=dev -e AWS_REGION=us-east-1 \
    --deployBucket not-a-real-bucket

sls invoke local -p test/sns-cloudwatch-event.json \
    -f cloudwatch-to-slack \
    -e AWS_ENV=dev -e AWS_REGION=us-east-1 \
    --deployBucket not-a-real-bucket

sls invoke local -p test/sns-codedeploy-configuration.json \
    -f cloudwatch-to-slack \
    -e AWS_ENV=dev -e AWS_REGION=us-east-1 \
    --deployBucket not-a-real-bucket

sls invoke local -p test/sns-codedeploy-event.json \
    -f cloudwatch-to-slack \
    -e AWS_ENV=dev -e AWS_REGION=us-east-1 \
    --deployBucket not-a-real-bucket

sls invoke local -p test/sns-codepipeline-event-pipeline-started.json \
    -f cloudwatch-to-slack \
    -e AWS_ENV=dev -e AWS_REGION=us-east-1 \
    --deployBucket not-a-real-bucket

sls invoke local -p test/sns-codepipeline-event-stage-failed.json \
    -f cloudwatch-to-slack \
    -e AWS_ENV=dev -e AWS_REGION=us-east-1 \
    --deployBucket not-a-real-bucket

sls invoke local -p test/sns-codepipeline-event-stage-started.json \
    -f cloudwatch-to-slack \
    -e AWS_ENV=dev -e AWS_REGION=us-east-1 \
    --deployBucket not-a-real-bucket

sls invoke local -p test/sns-codepipeline-event-stage-succeeded.json \
    -f cloudwatch-to-slack \
    -e AWS_ENV=dev -e AWS_REGION=us-east-1 \
    --deployBucket not-a-real-bucket

sls invoke local -p test/sns-elastic-beanstalk-event.json \
    -f cloudwatch-to-slack \
    -e AWS_ENV=dev -e AWS_REGION=us-east-1 \
    --deployBucket not-a-real-bucket

sls invoke local -p test/sns-elasticache-event.json \
    -f cloudwatch-to-slack \
    -e AWS_ENV=dev -e AWS_REGION=us-east-1 \
    --deployBucket not-a-real-bucket

sls invoke local -p test/sns-event.json \
    -f cloudwatch-to-slack \
    -e AWS_ENV=dev -e AWS_REGION=us-east-1 \
    --deployBucket not-a-real-bucket