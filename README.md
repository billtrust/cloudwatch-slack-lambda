PARENT PROJECT INFORMATION:

# lambda-cloudwatch-slack

An [AWS Lambda](http://aws.amazon.com/lambda/) function for better Slack notifications. 
[Check out the blog post](https://assertible.com/blog/npm-package-lambda-cloudwatch-slack).

## Overview

This function was originally derived from the
[AWS blueprint named `cloudwatch-alarm-to-slack`](https://aws.amazon.com/blogs/aws/new-slack-integration-blueprints-for-aws-lambda/).

# For this fork:

Non-trivial changes were made to the upstream project to support upgrading to node 8.10, testing, using a dedicated logger, removing unnecessary pieces, adding a Docker build environment, and converting this to use Serverless instead.

### 1. Clone this repository

### 3. Setup Slack hook

Follow these steps to configure the webhook in Slack:

  1. Navigate to
     [https://slack.com/services/new](https://slack.com/services/new)
     and search for and select "Incoming WebHooks".

  3. Choose the default channel where messages will be sent and click
     "Add Incoming WebHooks Integration".

  4. Copy the webhook URL from the setup instructions and use it in
     the next section.

  5. Click 'Save Settings' at the bottom of the Slack integration
     page.

#### Encrypted the Slack webhook URL

If you don't want or need to encrypt your hook URL, you can use the
`UNENCRYPTED_HOOK_URL`.  If this variable is specified, the
`KMS_ENCRYPTED_HOOK_URL` is ignored.

If you **do** want to encrypt your hook URL, follow these steps to
encrypt your Slack hook URL for use in this function:

  1. Create a KMS key -
     http://docs.aws.amazon.com/kms/latest/developerguide/create-keys.html.

  2. Encrypt the event collector token using the AWS CLI.
     $ aws kms encrypt --key-id alias/<KMS key name> --plaintext "<SLACK_HOOK_URL>"

     Note: You must exclude the protocol from the URL
     (e.g. "hooks.slack.com/services/abc123").

  3. Copy the base-64 encoded, encrypted key (CiphertextBlob) to the
     ENCRYPTED_HOOK_URL variable.

  4. Give your function's role permission for the kms:Decrypt action.
     Example:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Stmt1443036478000",
            "Effect": "Allow",
            "Action": [
                "kms:Decrypt"
            ],
            "Resource": [
                "<your KMS key ARN>"
            ]
        }
    ]
}
```

## Tests

With the variables filled in, you can test the function:

```bash
   docker build -t lambda-cloudwatch-slack .

   export HOOK_URL=<HOOK_URL> && \
   docker run --rm -e HOOK_URL=$HOOK_URL lambda-cloudwatch-slack
```

For encrypted hook urls, use KMS_HOOK_URL instead.

### 4. Deploy to AWS Lambda

The final step is to deploy the integration to AWS Lambda:

```bash
export AWS_REGION=${AWS_DEFAULT_REGION:-us-east-1}
export AWS_ENV=dev
export HOOK_URL=https://hooks.slack.com/services/ABCDEFG/12345678
./deploy $AWS_ENV $HOOK_URL
```

Which is the same thing as running these commands:

```bash
docker build -t lambda-cloudwatch-slack .

export AWS_ENV="dev" && \
export AWS_REGION="us-east-1" && \
export DEPLOY_BUCKET="billtrust-deploy-$AWS_ENV-$AWS_REGION" && \
export HOOK_URL=<HOOK_URL> && \
iam-docker-run \
   --image lambda-cloudwatch-slack \
   --profile $AWS_ENV \
   -e DEPLOY_BUCKET=$DEPLOY_BUCKET \
   -e HOOK_URL=$HOOK_URL \
   --full-entrypoint "npm run deploy"
```

For encrypted hook urls, use KMS_HOOK_URL instead.

## License

MIT License
