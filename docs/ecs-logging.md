# ECS CloudWatch logging setup

The ECS task definition ships logs to CloudWatch using the `awslogs` log driver.
Before deploying, create the log group once and ensure the execution role can
create log groups (recommended).

## Create the log group (one-time)

```bash
aws logs create-log-group --log-group-name "/ecs/civix" --region us-east-2
```

Optional retention policy:

```bash
aws logs put-retention-policy --log-group-name "/ecs/civix" --retention-in-days 14 --region us-east-2
```

## Allow the execution role to create log groups

Attach an inline policy to `ecsTaskExecutionRole` so ECS can create log groups
if they are missing:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["logs:CreateLogGroup"],
      "Resource": "*"
    }
  ]
}
```

Example CLI command to attach the inline policy:

```bash
aws iam put-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-name ecs-allow-create-log-groups \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": ["logs:CreateLogGroup"],
        "Resource": "*"
      }
    ]
  }'
```

Without this, ECS can only create log streams when the group already exists.

## Quick verification

Confirm the task definition revision has the expected log configuration:

```bash
aws ecs describe-task-definition \
  --task-definition <YOUR_TASKDEF_ARN> \
  --query 'taskDefinition.containerDefinitions[0].logConfiguration' \
  --output json
```

Expected values: `awslogs`, `/ecs/civix`, `us-east-2`.

Confirm the log group exists:

```bash
aws logs describe-log-groups --log-group-name-prefix "/ecs/civix" --region us-east-2
```
