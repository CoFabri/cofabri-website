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
  // eslint-config-next 16.4 (eslint-plugin-react-hooks 7.1) turned these two
  // React Compiler rules into errors. They flag ~24 long-standing patterns
  // (fetch-on-mount effects, a ref read in SupportForm) that were clean under
  // 16.1. Kept visible as warnings so the security upgrade doesn't also force
  // a refactor of those components; clean them up separately.
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
];

export default eslintConfig;
