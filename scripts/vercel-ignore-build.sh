#!/usr/bin/env bash
# Vercel "Ignored Build Step" (vercel.json ignoreCommand).
# Exit 0 = skip this build, exit 1 = build it.
#
# 1. Only production (main) and BUILD_BRANCHES build. Every other branch --
#    feature, claude/*, dependabot/* -- gets no preview deployment. Add a
#    branch here only if something depends on it building, e.g. a custom
#    domain assigned to that branch in the Vercel project.
# 2. A build that passes (1) is still skipped when nothing outside the
#    excluded paths changed since the last deployed commit. If that commit
#    isn't in Vercel's shallow clone, build rather than guess.
set -u

BUILD_BRANCHES=""
EXCLUDES=(':!docs/**')

branch="${VERCEL_GIT_COMMIT_REF:-}"
# Production is recognised by VERCEL_ENV or by the production branch name, and
# an unknown branch builds: failing open keeps production deploying even if
# the system env vars aren't present.
if [ "${VERCEL_ENV:-}" != "production" ] && [ "$branch" != "main" ] && [ -n "$branch" ]; then
  allowed=0
  for b in $BUILD_BRANCHES; do
    [ "$b" = "$branch" ] && allowed=1
  done
  if [ "$allowed" -eq 0 ]; then
    echo "Skipping preview build for branch '${branch}' (not in BUILD_BRANCHES)"
    exit 0
  fi
fi

base="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"
git cat-file -e "${base}^{commit}" 2>/dev/null || exit 1
git diff --quiet "$base" HEAD -- . "${EXCLUDES[@]}"
