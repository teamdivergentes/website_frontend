#!/bin/bash

# Script pour déterminer les tags Docker basés sur le contexte du workflow
# Usage: ./determine-tags.sh

set -e

# Déterminer le tag basé sur le contexte
if [[ "$GITHUB_EVENT_NAME" == "pull_request" ]]; then
    TAG_SUFFIX="unstable"
elif [[ "$GITHUB_REF" == "refs/heads/develop" ]]; then
    TAG_SUFFIX="dev"
elif [[ "$GITHUB_REF" == "refs/heads/main" ]]; then
    TAG_SUFFIX="RC"
elif [[ "$GITHUB_REF" == refs/tags/v* ]]; then  # Format: vXX.YY.ZZ
    TAG_SUFFIX="RELEASE"
else
    TAG_SUFFIX="unstable"
fi

# Construire les tags
IMAGE_TAG="ghcr.io/$GITHUB_REPOSITORY/dvg_web_frontend:$GITHUB_SHA"
WORKFLOW_TAG="ghcr.io/$GITHUB_REPOSITORY/dvg_web_frontend:$TAG_SUFFIX"

# Exporter les variables
echo "image-tag=$IMAGE_TAG" >> $GITHUB_OUTPUT
echo "workflow-tag=$WORKFLOW_TAG" >> $GITHUB_OUTPUT
echo "tag-suffix=$TAG_SUFFIX" >> $GITHUB_OUTPUT

echo "✅ Tags déterminés:"
echo "  - Image tag: $IMAGE_TAG"
echo "  - Workflow tag: $WORKFLOW_TAG"
echo "  - Suffix: $TAG_SUFFIX"
