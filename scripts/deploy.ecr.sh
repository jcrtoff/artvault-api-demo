#!/usr/bin/env bash
#
# deploy.ecr.sh — build the demo as a linux/amd64 image and push it to ECR.
#
# Mirrors artvault/scripts/deploy_frontend_prod.sh, with two deliberate
# differences for this app:
#   1. No VITE_* / API-secret build args. This is an SSR app and the
#      ARTVAULT_API_KEY is a RUNTIME secret (charter rule 3) — it is injected
#      at task-definition / `docker run` time, never baked into the image.
#   2. Its own ECR stack (artvault-api-demo-ecr), independent from artvault.
#
# Prereqs:
#   - aws cli + docker buildx, profile `toffsystems_ecr`
#   - ECR repo created once: see infrastructure/ecr-repositories.yml
#
# Usage:
#   ./scripts/deploy.ecr.sh
#
set -euo pipefail

AWS_PROFILE="toffsystems_ecr"
AWS_REGION="us-east-1"
ECR_STACK="artvault-api-demo-ecr"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo "🚀 Building + pushing artvault-api-demo to ECR"
echo "🔑 AWS profile: $AWS_PROFILE"

ECR_REPO=$(aws cloudformation describe-stacks \
  --profile "$AWS_PROFILE" \
  --region "$AWS_REGION" \
  --stack-name "$ECR_STACK" \
  --query 'Stacks[0].Outputs[?OutputKey==`DemoRepositoryUri`].OutputValue' \
  --output text)

if [ -z "$ECR_REPO" ] || [ "$ECR_REPO" = "None" ]; then
  echo "❌ Could not find ECR repository from stack '$ECR_STACK'." >&2
  echo "   Create it first:" >&2
  echo "     aws cloudformation deploy --profile $AWS_PROFILE \\" >&2
  echo "       --stack-name $ECR_STACK \\" >&2
  echo "       --template-file infrastructure/ecr-repositories.yml" >&2
  exit 1
fi

echo "📦 ECR repository: $ECR_REPO"

echo "🔐 Logging in to ECR..."
aws ecr get-login-password --profile "$AWS_PROFILE" --region "$AWS_REGION" | \
  docker login --username AWS --password-stdin "$ECR_REPO"

GIT_SHA=$(git rev-parse --short HEAD)
TS=$(date +%Y%m%d-%H%M%S)
echo "📌 Git SHA: $GIT_SHA"

echo "🔨 Building image for linux/amd64..."
docker buildx build \
  --platform linux/amd64 \
  --build-arg GIT_SHA="$GIT_SHA" \
  -t "$ECR_REPO:latest" \
  -t "$ECR_REPO:$GIT_SHA" \
  -t "$ECR_REPO:$TS" \
  --push \
  .

echo "✅ Pushed:"
echo "   $ECR_REPO:latest"
echo "   $ECR_REPO:$GIT_SHA"
echo ""
echo "⚠️  Reminder: ARTVAULT_API_BASE and ARTVAULT_API_KEY are RUNTIME env vars."
echo "   Set them in the ECS task definition / container runtime, not the image."
echo "   The container listens on PORT (default 35105)."
