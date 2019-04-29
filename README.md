# sns-slack-lambda

An [AWS Lambda](http://aws.amazon.com/lambda/) function for better Slack notifications. 

## Overview

This was a fork of [assertible/lambda-cloudwatch-slack](https://github.com/assertible/lambda-cloudwatch-slack), however, now it not only formats cloudwatch alarms, but also will accept any json data and send to to slack as well.

Other non-trivial changes were made to the upstream project, such as upgrading to Node 8.10, improved testing, using a dedicated logger, removing abandoned sections of code, adding a Docker build environment, and converting this to use Serverless instead instead of node-lambda.

## Setup Slack hook

Follow these steps to configure the webhook in Slack:

  1. Navigate to [the Slack API apps page](https://api.slack.com/apps) and create a new app in your workspace.

  2. Under Features, click incoming webhooks.

  3. Create a new integration in the channel of your choice. For now, you will need to deploy a new lambda for each webhook. I would reccomend choosing one alert channel for each AWS environment, and having all alerts go there.

  4. Click 'Authorize' at the bottom to install the app in that channel.

  5. Copy the webhook URL from the setup instructions and use it in the next section.

## Setting the Hook URL

The incoming webhook is defined via SSM during the deployment process. Unencrypted is read from `/devops/sns-slack-lambda/HOOK_URL`, and the kms hook is read from `/devops/sns-slack-lambda/KMS_HOOK_URL`. 

If you don't want or need to encrypt your hook URL, you can just set `HOOK_URL`, and the `KMS_HOOK_URL` is ignored.

If you **do** want to encrypt your hook URL, follow these steps to
encrypt your Slack hook URL for use in this function:

  1. Create a KMS key -
     http://docs.aws.amazon.com/kms/latest/developerguide/create-keys.html.

  2. Encrypt the event collector token using the AWS CLI.
     $ aws kms encrypt --key-id alias/<KMS key name> --plaintext "<SLACK_HOOK_URL>"

     Note: You must exclude the protocol from the URL
     (e.g. "hooks.slack.com/services/abc123").

  3. Copy the base-64 encoded, encrypted key (CiphertextBlob) to the
     ENCRYPTED\_HOOK\_URL variable.

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

## Hook Url

## Tests

With the variables filled in, you can test the function:

```bash
   docker build -t sns-slack-lambda . && \
   docker run --rm sns-slack-lambda
```

### 4. Deploy to AWS Lambda

The final step is to deploy the integration to AWS Lambda:

```bash
export AWS_REGION=us-east-1 && \
export AWS_ENV=dev && \
export ORG=my-company
./deploy
```

Which is the same thing as running these commands:

```bash
export AWS_ENV=dev && \
export AWS_REGION=us-east-1 && \
export ORG=my-company && \
docker build -t sns-slack-lambda . && \
iam-docker-run \
   --image sns-slack-lambda \
   --profile $AWS_ENV \
   -e DEPLOY_BUCKET=$ORG-deploy-$AWS_ENV-$AWS_REGION \
   --full-entrypoint "npm run deploy"
```
