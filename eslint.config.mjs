import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  // eslint-config-next only ignores .next/**, out/**, build/** at the repo
  // root (flat-config ignore globs are anchored, not recursive), so nested
  // build output under .worktrees/ (this repo's git-ignored git-worktree
  // scratch dirs, each a full checkout with its own node_modules/.next)
  // needs its own explicit ignore or it gets linted too.
  { ignores: [".worktrees/**"] },
  ...nextCoreWebVitals,
  ...nextTypescript,
];

export default eslintConfig;
