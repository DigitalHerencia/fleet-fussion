<!-- @format -->

# Merge Conflict Resolution Guide

To resolve merge conflicts in FleetFusion, follow these steps:

## 1. Fetch Latest Main

```sh
git checkout main
git pull origin main
```

## 2. Checkout Your PR Branch

```sh
git checkout your-feature-branch
```

## 3. Rebase (Recommended)

```sh
git rebase main
```

-   If you see conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`), edit the files to resolve them.
-   After resolving each file:

```sh
git add <conflicted-file>
git rebase --continue
```

## 4. (Alternative) Merge Main into Your Branch

```sh
git merge main
```

-   Resolve conflicts as above, then:

```sh
git add <conflicted-file>
git commit
```

## 5. Test Your Code

```sh
npm run type-check
npm test
```

## 6. Push Your Changes

-   If you rebased:

```sh
git push --force-with-lease
```

-   If you merged:

```sh
git push
```

## 7. Verify on GitHub

-   Ensure the conflict warning is gone.
-   Check that CI passes before merging.

---

**Tips:**

-   Resolve related PRs in dependency order.
-   For lockfile conflicts, merge the most fundamental dependency change first.
-   Update project board and milestones after resolving.

For more help, see [GitHub's official documentation](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/about-merge-conflicts).
