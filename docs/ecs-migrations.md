# Running Prisma migrations in ECS

Prisma migrations must run inside AWS because the RDS instance is in a private VPC and is not reachable from GitHub-hosted runners. Use a one-off ECS task that reuses the **same task definition** as the running service so the exact image, environment variables, and networking apply.

## Prerequisites

- AWS CLI configured with access to the ECS cluster.
- The task definition used by the service is registered (same family/revision as the service).
- The service VPC, subnets, and security groups allow access to the private RDS instance.

### GitHub Actions IAM permissions

Ensure the GitHub Actions role can run one-off tasks and pass the ECS roles used by the task definition:

- `ecs:RunTask`
- `ecs:DescribeTasks`
- `ecs:DescribeTaskDefinition`
- `ecs:ListTasks` (optional, for troubleshooting)
- `iam:PassRole` for the task execution role and task role

## Run a one-off migration task

1. **Find the current task definition revision used by the service.**

   ```bash
   aws ecs describe-services \
     --cluster <cluster-name> \
     --services <service-name> \
     --query "services[0].taskDefinition" \
     --output text
   ```

2. **Run a one-off task with the same task definition.**

   Use the same VPC, subnets, and security groups as the service. Override the container command to run Prisma migrations.

   ```bash
   aws ecs run-task \
     --cluster <cluster-name> \
     --launch-type FARGATE \
     --task-definition <task-definition-arn> \
    --network-configuration "awsvpcConfiguration={subnets=[<subnet-1>,<subnet-2>],securityGroups=[<sg-1>],assignPublicIp=ENABLED}" \
     --overrides '{
       "containerOverrides": [
         {
           "name": "<container-name>",
           "command": ["npx", "prisma", "migrate", "deploy"]
         }
       ]
     }'
   ```

   - The task definition already provides environment variables (including `DATABASE_URL`) in the same way as the service.
   - Do **not** log or hardcode database credentials in the command or overrides.

3. **Verify success in CloudWatch Logs.**

   - Open the log group for the task (same log group as the service).
   - Confirm the migration logs show a successful deploy.

## Validation

After the task completes successfully:

- The table `public.DecisionFlow` should exist in the database.
- The `/api/flows` endpoint should respond successfully.
