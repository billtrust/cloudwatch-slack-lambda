const AWS = require('aws-sdk'),
      url = require('url'),
      https = require('https'),
      config = require('./config'),
      _ = require('lodash'),
      logger = require('./logger');

const baseSlackMessage = {}

let hookUrl;

const postMessage = function(message, callback) {
  let body = JSON.stringify(message),
      options = url.parse(hookUrl);
  options.method = 'POST';
  options.headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  };

  let postReq = https.request(options, function(res) {
    let chunks = [];
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      return chunks.push(chunk);
    });
    res.on('end', function() {
      const body = chunks.join('');
      if (callback) {
        callback({
          body: body,
          statusCode: res.statusCode,
          statusMessage: res.statusMessage
        });
      }
    });
    return res;
  });

  postReq.write(body);
  postReq.end();
};

const handleElasticBeanstalk = function(event, context) {
  let timestamp = (new Date(event.Records[0].Sns.Timestamp)).getTime()/1000,
   subject = event.Records[0].Sns.Subject || "AWS Elastic Beanstalk Notification",
   message = event.Records[0].Sns.Message,

   stateRed = message.indexOf(" to RED"),
   stateSevere = message.indexOf(" to Severe"),
   butWithErrors = message.indexOf(" but with errors"),
   noPermission = message.indexOf("You do not have permission"),
   failedDeploy = message.indexOf("Failed to deploy application"),
   failedConfig = message.indexOf("Failed to deploy configuration"),
   failedQuota = message.indexOf("Your quota allows for 0 more running instance"),
   unsuccessfulCommand = message.indexOf("Unsuccessful command execution"),

   stateYellow = message.indexOf(" to YELLOW"),
   stateDegraded = message.indexOf(" to Degraded"),
   stateInfo = message.indexOf(" to Info"),
   removedInstance = message.indexOf("Removed instance "),
   addingInstance = message.indexOf("Adding instance "),
   abortedOperation = message.indexOf(" aborted operation."),
   abortedDeployment = message.indexOf("some instances may have deployed the new application version");

  let color = "good";

  if (stateRed != -1 || stateSevere != -1 || butWithErrors != -1 || noPermission != -1 || failedDeploy != -1 || failedConfig != -1 || failedQuota != -1 || unsuccessfulCommand != -1) {
    color = "danger";
  }
  if (stateYellow != -1 || stateDegraded != -1 || stateInfo != -1 || removedInstance != -1 || addingInstance != -1 || abortedOperation != -1 || abortedDeployment != -1) {
    color = "warning";
  }

  let slackMessage = {
    text: "*" + subject + "*",
    attachments: [
      {
        "fields": [
          { "title": "Subject", "value": event.Records[0].Sns.Subject, "short": false},
          { "title": "Message", "value": message, "short": false}
        ],
        "color": color,
        "ts":  timestamp
      }
    ]
  };

  return _.merge(slackMessage, baseSlackMessage);
};

const handleCodeDeploy = function(event, context) {
  const subject = "AWS CodeDeploy Notification",
        timestamp = (new Date(event.Records[0].Sns.Timestamp)).getTime()/1000,
        snsSubject = event.Records[0].Sns.Subject;

  let message,
      fields = [],
      color = "warning";

  try {
    message = JSON.parse(event.Records[0].Sns.Message);

    if(message.status === "SUCCEEDED"){
      color = "good";
    } else if(message.status === "FAILED"){
      color = "danger";
    }
    fields.push({ "title": "Message", "value": snsSubject, "short": false });
    fields.push({ "title": "Deployment Group", "value": message.deploymentGroupName, "short": true });
    fields.push({ "title": "Application", "value": message.applicationName, "short": true });
    fields.push({
      "title": "Status Link",
      "value": "https://console.aws.amazon.com/codedeploy/home?region=" + message.region + "#/deployments/" + message.deploymentId,
      "short": false
    });
  }
  catch(e) {
    color = "good";
    message = event.Records[0].Sns.Message;
    fields.push({ "title": "Message", "value": snsSubject, "short": false });
    fields.push({ "title": "Detail", "value": message, "short": false });
  }


  let slackMessage = {
    text: "*" + subject + "*",
    attachments: [
      {
        "color": color,
        "fields": fields,
        "ts": timestamp
      }
    ]
  };

  return _.merge(slackMessage, baseSlackMessage);
};

const handleCodePipeline = function(event, context) {
  const subject = "AWS CodePipeline Notification",
        timestamp = (new Date(event.Records[0].Sns.Timestamp)).getTime()/1000;

  let message,
      fields = [],
      color = "warning",
      changeType = "";

  try {
    message = JSON.parse(event.Records[0].Sns.Message);
    detailType = message['detail-type'];

    if(detailType === "CodePipeline Pipeline Execution State Change"){
      changeType = "";
    } else if(detailType === "CodePipeline Stage Execution State Change"){
      changeType = "STAGE " + message.detail.stage;
    } else if(detailType === "CodePipeline Action Execution State Change"){
      changeType = "ACTION";
    }

    if(message.detail.state === "SUCCEEDED"){
      color = "good";
    } else if(message.detail.state === "FAILED"){
      color = "danger";
    }
    header = message.detail.state + ": CodePipeline " + changeType;
    fields.push({ "title": "Message", "value": header, "short": false });
    fields.push({ "title": "Pipeline", "value": message.detail.pipeline, "short": true });
    fields.push({ "title": "Region", "value": message.region, "short": true });
    fields.push({
      "title": "Status Link",
      "value": "https://console.aws.amazon.com/codepipeline/home?region=" + message.region + "#/view/" + message.detail.pipeline,
      "short": false
    });
  }
  catch(e) {
    color = "good";
    message = event.Records[0].Sns.Message;
    header = message.detail.state + ": CodePipeline " + message.detail.pipeline;
    fields.push({ "title": "Message", "value": header, "short": false });
    fields.push({ "title": "Detail", "value": message, "short": false });
  }


  let slackMessage = {
    text: "*" + subject + "*",
    attachments: [
      {
        "color": color,
        "fields": fields,
        "ts": timestamp
      }
    ]
  };

  return _.merge(slackMessage, baseSlackMessage);
};

const handleElasticache = function(event, context) {
  const subject = "AWS ElastiCache Notification",
        message = JSON.parse(event.Records[0].Sns.Message),
        timestamp = (new Date(event.Records[0].Sns.Timestamp)).getTime()/1000,
        region = event.Records[0].EventSubscriptionArn.split(":")[3];

  let eventname, nodename;
      color = "good";

  for(key in message){
    eventname = key;
    nodename = message[key];
    break;
  }
  let slackMessage = {
    text: "*" + subject + "*",
    attachments: [
      {
        "color": color,
        "fields": [
          { "title": "Event", "value": eventname.split(":")[1], "short": true },
          { "title": "Node", "value": nodename, "short": true },
          {
            "title": "Link to cache node",
            "value": "https://console.aws.amazon.com/elasticache/home?region=" + region + "#cache-nodes:id=" + nodename + ";nodes",
            "short": false
          }
        ],
        "ts": timestamp
      }
    ]
  };
  return _.merge(slackMessage, baseSlackMessage);
};

const handleCloudWatch = function(event, context) {
  const timestamp = (new Date(event.Records[0].Sns.Timestamp)).getTime()/1000,
        message = JSON.parse(event.Records[0].Sns.Message),
        region = event.Records[0].EventSubscriptionArn.split(":")[3],
        subject = "AWS CloudWatch Notification",
        alarmName = message.AlarmName,
        metricName = message.Trigger.MetricName,
        oldState = message.OldStateValue,
        newState = message.NewStateValue,
        alarmDescription = message.AlarmDescription,
        alarmReason = message.NewStateReason,
        trigger = message.Trigger;

  let color = "warning";

  if (newState === "ALARM") {
      color = "danger";
  } else if (newState === "OK") {
      color = "good";
  }

  let slackMessage = {
    text: "*" + subject + "*",
    attachments: [
      {
        "color": color,
        "fields": [
          { "title": "Alarm Name", "value": alarmName, "short": true },
          { "title": "Alarm Description", "value": alarmDescription, "short": true },
          { "title": "Alarm Reason", "value": alarmReason, "short": false },
          {
            "title": "Trigger",
            "value": trigger.Statistic + " "
              + metricName + " "
              + trigger.ComparisonOperator + " "
              + trigger.Threshold + " for "
              + trigger.EvaluationPeriods + " period(s) of "
              + trigger.Period + " seconds.",
              "short": false
          },
          { "title": "Old State", "value": oldState, "short": true },
          { "title": "Current State", "value": newState, "short": true },
          {
            "title": "Link to Alarm",
            "value": "https://console.aws.amazon.com/cloudwatch/home?region=" + region + "#alarm:alarmFilter=ANY;name=" + encodeURIComponent(alarmName),
            "short": false
          }
        ],
        "ts":  timestamp
      }
    ]
  };
  return _.merge(slackMessage, baseSlackMessage);
};

const handleAutoScaling = function(event, context) {
  const subject = "AWS AutoScaling Notification",
        message = JSON.parse(event.Records[0].Sns.Message),
        timestamp = (new Date(event.Records[0].Sns.Timestamp)).getTime()/1000;

  let color = "good";

  let slackMessage = {
    text: "*" + subject + "*",
    attachments: [
      {
        "color": color,
        "fields": [
          { "title": "Message", "value": event.Records[0].Sns.Subject, "short": false },
          { "title": "Description", "value": message.Description, "short": false },
          { "title": "Event", "value": message.Event, "short": false },
          { "title": "Cause", "value": message.Cause, "short": false }

        ],
        "ts": timestamp
      }
    ]
  };
  return _.merge(slackMessage, baseSlackMessage);
};

const handleCatchAll = function(event, context) {

    const record = event.Records[0],
          subject = record.Sns.Subject,
          timestamp = new Date(record.Sns.Timestamp).getTime() / 1000,
          message = JSON.parse(record.Sns.Message);

    let color = "warning";

    if (message.NewStateValue === "ALARM") {
        color = "danger";
    } else if (message.NewStateValue === "OK") {
        color = "good";
    }

    // Add all of the values from the event message to the Slack message description
    let description = ""
    for(key in message) {

        let renderedMessage = typeof message[key] === 'object'
                            ? JSON.stringify(message[key])
                            : message[key]

        description = description + "\n" + key + ": " + renderedMessage
    }

    let slackMessage = {
        text: "*" + subject + "*",
        attachments: [
          {
            "color": color,
            "fields": [
              { "title": "Message", "value": record.Sns.Subject, "short": false },
              { "title": "Description", "value": description, "short": false }
            ],
            "ts": timestamp
          }
        ]
    }

  return _.merge(slackMessage, baseSlackMessage);
}

const processEvent = function(event, context) {
  logger.debug("sns received:" + JSON.stringify(event, null, 2));
  let slackMessage = null,
      eventSnsMessage = null;

  const eventSubscriptionArn = event.Records[0].EventSubscriptionArn,
        eventSnsSubject = event.Records[0].Sns.Subject || 'no subject',
        eventSnsMessageRaw = event.Records[0].Sns.Message;

  try {
    eventSnsMessage = JSON.parse(eventSnsMessageRaw);
  }
  catch (e) {    
  }

  if(eventSubscriptionArn.indexOf(config.services.codepipeline.match_text) > -1 || eventSnsSubject.indexOf(config.services.codepipeline.match_text) > -1 || eventSnsMessageRaw.indexOf(config.services.codepipeline.match_text) > -1){
    logger.debug("processing codepipeline notification");
    slackMessage = handleCodePipeline(event,context)
  }
  else if(eventSubscriptionArn.indexOf(config.services.elasticbeanstalk.match_text) > -1 || eventSnsSubject.indexOf(config.services.elasticbeanstalk.match_text) > -1 || eventSnsMessageRaw.indexOf(config.services.elasticbeanstalk.match_text) > -1){
    logger.debug("processing elasticbeanstalk notification");
    slackMessage = handleElasticBeanstalk(event,context)
  }
  else if(eventSnsMessage && 'AlarmName' in eventSnsMessage && 'AlarmDescription' in eventSnsMessage){
    logger.debug("processing cloudwatch notification");
    slackMessage = handleCloudWatch(event,context);
  }
  else if(eventSubscriptionArn.indexOf(config.services.codedeploy.match_text) > -1 || eventSnsSubject.indexOf(config.services.codedeploy.match_text) > -1 || eventSnsMessageRaw.indexOf(config.services.codedeploy.match_text) > -1){
    logger.debug("processing codedeploy notification");
    slackMessage = handleCodeDeploy(event,context);
  }
  else if(eventSubscriptionArn.indexOf(config.services.elasticache.match_text) > -1 || eventSnsSubject.indexOf(config.services.elasticache.match_text) > -1 || eventSnsMessageRaw.indexOf(config.services.elasticache.match_text) > -1){
    logger.debug("processing elasticache notification");
    slackMessage = handleElasticache(event,context);
  }
  else if(eventSubscriptionArn.indexOf(config.services.autoscaling.match_text) > -1 || eventSnsSubject.indexOf(config.services.autoscaling.match_text) > -1 || eventSnsMessageRaw.indexOf(config.services.autoscaling.match_text) > -1){
    logger.debug("processing autoscaling notification");
    slackMessage = handleAutoScaling(event, context);
  }
  else{
    slackMessage = handleCatchAll(event, context);
  }

  postMessage(slackMessage, function(response) {
    if (response.statusCode < 400) {
      logger.info('Message posted successfully');
      context.succeed();
    } else if (response.statusCode < 500) {
      logger.error("error posting message to slack API: " + response.statusCode + " - " + response.statusMessage);
      // Don't retry because the error is due to a problem with the request
      context.succeed();
    } else {
      // Let Lambda retry
      context.fail("server error when processing message: " + response.statusCode + " - " + response.statusMessage);
    }
  });
};

exports.handler = function(event, context) {
  if (hookUrl) {
    processEvent(event, context);
  } else if (config.UNENCRYPTED_HOOK_URL && config.UNENCRYPTED_HOOK_URL !== "none") {
    hookUrl = config.UNENCRYPTED_HOOK_URL;
    processEvent(event, context);
  } else if (config.KMS_ENCRYPTED_HOOK_URL && config.KMS_ENCRYPTED_HOOK_URL !== 'none') {
    const encryptedBuf = new Buffer(config.KMS_ENCRYPTED_HOOK_URL, 'base64'),
          cipherText = { CiphertextBlob: encryptedBuf },
          kms = new AWS.KMS();

    kms.decrypt(cipherText, function(err, data) {
      if (err) {
        logger.debug("decrypt error: " + err);
        processEvent(event, context);
      } else {
        hookUrl = "https://" + data.Plaintext.toString('ascii');
        processEvent(event, context);
      }
    });
  } else {
    context.fail('hook url has not been set.');
  }
};